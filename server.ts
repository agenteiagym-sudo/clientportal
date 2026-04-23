import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Stripe from 'stripe';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import CryptoJS from 'crypto-js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = process.env.STRIPE_SECRET_KEY?.trim();
    
    if (!key || key === '' || key.includes('TODO') || key.includes('your_key')) {
      throw new Error('STRIPE_SECRET_KEY is missing or contains a placeholder. Please go to Settings > Secrets and set a valid Stripe Secret Key (starting with sk_test_ or sk_live_).');
    }

    stripeClient = new Stripe(key, {
      apiVersion: '2026-02-25.clover' as any,
    });
  }
  return stripeClient;
}

// Supabase Admin Client (to bypass RLS and update user status)
const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function startServer() {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const isEncryptionKeyValid = encryptionKey && 
                               encryptionKey !== 'tu_clave_aqui' && 
                               encryptionKey !== 'default_secret_key_1234567890';
  
  if (!isEncryptionKeyValid) {
    console.error("CRITICAL WARNING: ENCRYPTION_KEY is missing or insecure. Encryption/Decryption APIs will return errors.");
    // No exit here to allow the rest of the app (Stripe, etc) to function and to show the UI
  }

  const app = express();
  const PORT = 3000;

  app.use(cors());

  // Stripe Webhook needs raw body for signature verification
  app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET is not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    let event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        webhookSecret
      );
    } catch (err: any) {
      console.error(`Webhook Error: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const subscriptionId = session.subscription as string;
      const customerId = session.customer as string;

      if (userId) {
        console.log(`Payment successful for user: ${userId}. Activating profile...`);
        
        // Calculate expiration date (30 days from now)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({ 
            is_active: true,
            plan_name: 'Premium',
            plan_details: 'Acceso completo a nutrición y entrenamiento (Suscripción mensual)',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            membership_expires_at: expiresAt.toISOString()
          })
          .eq('id', userId);

        if (error) {
          console.error('Error activating user profile:', error);
        } else {
          console.log(`User ${userId} activated successfully with subscription ${subscriptionId}.`);
        }
      }
    }

    if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;

      console.log(`Subscription ${subscription.id} deleted for customer ${customerId}. Deactivating profile...`);

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_active: false,
          stripe_subscription_id: null
        })
        .eq('stripe_customer_id', customerId);

      if (error) {
        console.error('Error deactivating user profile:', error);
      } else {
        console.log(`Profile for customer ${customerId} deactivated.`);
      }
    }

    res.json({ received: true });
  });

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // API Routes
  app.post('/api/create-checkout-session', async (req, res) => {
    try {
      const { userId, email, planId } = req.body;
      const stripe = getStripe();

      // Dynamic URL discovery
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.get('host');
      const origin = `${protocol}://${host}`;
      const appUrl = process.env.APP_URL || origin;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'GymFlow Premium Plan',
                description: 'Acceso completo a nutrición y entrenamiento (Suscripción mensual)',
              },
              unit_amount: 4500, // $45.00
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${appUrl}/?payment=success`,
        cancel_url: `${appUrl}/?payment=cancel`,
        metadata: {
          userId,
        },
      });

      res.json({ id: session.id, url: session.url });
    } catch (error: any) {
      console.error('Stripe error:', error.message);
      res.status(500).json({ 
        error: error.message,
        isConfigError: error.message.includes('STRIPE_SECRET_KEY')
      });
    }
  });

  app.post('/api/cancel-subscription', async (req, res) => {
    try {
      const { subscriptionId } = req.body;

      if (!subscriptionId) {
        return res.status(400).json({ error: 'Subscription ID is required' });
      }

      const stripe = getStripe();
      const cancelledSubscription = await stripe.subscriptions.cancel(subscriptionId);

      res.json({ status: cancelledSubscription.status });
    } catch (error: any) {
      console.error('Stripe cancellation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const getEncryptionKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key || key === 'tu_clave_aqui' || key === 'default_secret_key_1234567890') {
      return null;
    }
    return key.trim();
  };

  app.post("/api/encrypt", (req, res) => {
    try {
      const { data } = req.body;
      const key = getEncryptionKey();
      
      if (!key) {
        return res.status(503).json({ error: "Servicio de cifrado no disponible. ENCRYPTION_KEY no está configurada." });
      }

      const stringData = typeof data === 'string' ? data : JSON.stringify(data);
      const ciphertext = CryptoJS.AES.encrypt(stringData, key).toString();
      res.json({ ciphertext });
    } catch (error: any) {
      console.error("Error al cifrar:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/decrypt", (req, res) => {
    try {
      const { ciphertext } = req.body;
      const key = getEncryptionKey();

      if (!key) {
        return res.status(503).json({ error: "Servicio de descifrado no disponible. ENCRYPTION_KEY no está configurada." });
      }

      // El formato de CryptoJS suele empezar con U2FsdGVkX1
      if (!ciphertext || typeof ciphertext !== 'string' || !ciphertext.startsWith('U2FsdGVkX1')) {
        return res.json({ data: ciphertext });
      }

      const bytes = CryptoJS.AES.decrypt(ciphertext, key);
      const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
      
      if (!decryptedStr) {
        return res.status(400).json({ error: "No se pudo descifrar el contenido. Verifica la clave." });
      }

      try {
        // Intentamos devolverlo como objeto si es JSON
        res.json({ data: JSON.parse(decryptedStr) });
      } catch {
        res.json({ data: decryptedStr });
      }
    } catch (error: any) {
      console.error("Error al descifrar:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
