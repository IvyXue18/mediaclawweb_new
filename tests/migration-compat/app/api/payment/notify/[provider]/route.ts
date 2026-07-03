import {
  PaymentEventType,
  SubscriptionCycleType,
} from '@/extensions/payment/types';
import {
  findOrderByOrderNo,
  findOrderByTransactionId,
} from '@/shared/models/order';
import { findSubscriptionByProviderSubscriptionId } from '@/shared/models/subscription';
import {
  getPaymentService,
  handleCheckoutSuccess,
  handleSubscriptionCanceled,
  handleSubscriptionRenewal,
  handleSubscriptionUpdated,
} from '@/shared/services/payment';
import { handleRefundCommission } from '@/shared/services/referral';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params;
    if (!provider) {
      throw new Error('provider is required');
    }

    const paymentService = await getPaymentService();
    const paymentProvider = paymentService.getProvider(provider);
    if (!paymentProvider) {
      throw new Error('payment provider not found');
    }

    const event = await paymentProvider.getPaymentEvent({ req });
    if (!event?.eventType) {
      throw new Error('payment event not found');
    }

    const session = event.paymentSession;
    if (!session) {
      throw new Error('payment session not found');
    }

    if (event.eventType === PaymentEventType.CHECKOUT_SUCCESS) {
      const orderNo = session.metadata?.order_no;
      if (!orderNo) {
        throw new Error('order no not found');
      }

      const order = await findOrderByOrderNo(orderNo);
      if (!order) {
        throw new Error('order not found');
      }

      await handleCheckoutSuccess({ order, session });
    } else if (event.eventType === PaymentEventType.PAYMENT_SUCCESS) {
      if (session.subscriptionId && session.subscriptionInfo) {
        const existingSubscription =
          await findSubscriptionByProviderSubscriptionId({
            provider,
            subscriptionId: session.subscriptionId,
          });

        if (existingSubscription) {
          const subscriptionCycleType =
            session.paymentInfo?.subscriptionCycleType;
          const transactionId = session.paymentInfo?.transactionId;

          if (subscriptionCycleType === SubscriptionCycleType.CREATE) {
            return successResponse(provider);
          }

          if (subscriptionCycleType === SubscriptionCycleType.RENEWAL) {
            if (transactionId) {
              const existingOrder = await findOrderByTransactionId({
                transactionId,
                paymentProvider: provider,
              });
              if (existingOrder) {
                return successResponse(provider);
              }
            }

            await handleSubscriptionRenewal({
              subscription: existingSubscription,
              session,
            });
            return successResponse(provider);
          }

          if (transactionId) {
            const existingOrder = await findOrderByTransactionId({
              transactionId,
              paymentProvider: provider,
            });
            if (!existingOrder) {
              await handleSubscriptionRenewal({
                subscription: existingSubscription,
                session,
              });
            }
          }
        }
      } else {
        const orderNo = session.metadata?.order_no;
        if (orderNo) {
          const order = await findOrderByOrderNo(orderNo);
          if (!order) {
            throw new Error('order not found');
          }

          await handleCheckoutSuccess({ order, session });
        }
      }
    } else if (event.eventType === PaymentEventType.SUBSCRIBE_UPDATED) {
      if (!session.subscriptionId || !session.subscriptionInfo) {
        throw new Error('subscription id or subscription info not found');
      }

      const existingSubscription =
        await findSubscriptionByProviderSubscriptionId({
          provider,
          subscriptionId: session.subscriptionId,
        });
      if (!existingSubscription) {
        throw new Error('subscription not found');
      }

      await handleSubscriptionUpdated({
        subscription: existingSubscription,
        session,
      });
    } else if (event.eventType === PaymentEventType.SUBSCRIBE_CANCELED) {
      if (!session.subscriptionId || !session.subscriptionInfo) {
        throw new Error('subscription id or subscription info not found');
      }

      const existingSubscription =
        await findSubscriptionByProviderSubscriptionId({
          provider,
          subscriptionId: session.subscriptionId,
        });
      if (!existingSubscription) {
        throw new Error('subscription not found');
      }

      await handleSubscriptionCanceled({
        subscription: existingSubscription,
        session,
      });
    } else if (event.eventType === PaymentEventType.PAYMENT_REFUNDED) {
      const orderNo = session.metadata?.order_no;
      if (orderNo) {
        await handleRefundCommission(orderNo);
      }
    }

    return successResponse(provider);
  } catch (error: any) {
    return Response.json(
      {
        message: `handle payment notify failed: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

function successResponse(provider: string) {
  if (provider === 'zpay') {
    return new Response('success', { status: 200 });
  }

  return Response.json({ message: 'success' });
}
