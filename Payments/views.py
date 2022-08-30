
import json
from django.conf import settings
from django.http.response import HttpResponse, HttpResponseRedirect
from django.shortcuts import get_object_or_404, redirect, render, reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from Orders.models import Order
from .models import Payment
from Cart.cart import Cart
from django.core.mail import send_mail
import stripe
from django.http import JsonResponse

def getOrder(request):
    order_id = request.session.get("order_id")
    order = get_object_or_404(Order, id=order_id)
    return order


#Stripe
def paymentcomplete(request):
  if request.method=="POST":
    data = json.loads(request.POST.get("payload"))
    if data["status"] == "succeeded":
        pass
      # save purchase here/ setup email confirmation
    return HttpResponseRedirect(reverse('Payment:success'))


#Strip
@csrf_exempt
def createpayment(request):
    order = getOrder(request)
    cart  = order.items.all()
    total = order.get_total_price()
    total = int(total * 100)
    stripe.api_key = settings.STRIPE_SECRET_KEY
    if request.method=="POST":
      data = json.loads(request.body)
      # Create a PaymentIntent with the order amount and currency
      intent = stripe.PaymentIntent.create(
        amount=total,
        currency=data['currency'],
        metadata={'integration_check': 'accept_a_payment'},
        )
      try:
        return JsonResponse({'publishableKey':  
          settings.STRIPE_PUBLIC_KEY, 'clientSecret': intent.client_secret})
      except Exception as e:
        return JsonResponse({'error':str(e)},status= 403)

#Stripe
def checkoutstripe(request):
    context = {}
    context['order'] = getOrder(request)
    context['total'] = context['order'].get_total_price() #soma de todos os produtos + o shipping_price
    context['cart'] = context['order'].items.all()#objetos do carrinho.
    print(context['order'].__dict__)
    return render(request, 'payment/paymentstripe.html', context)




def PaymentMiddleware(order_id, client_email, cart):
    total_amount = cart.get_total_price()
    order = get_object_or_404(Order, id = order_id)
    Order.objects.filter(id = order_id).update(is_paid=True)
    Payment.objects.create(order= order ,transaction_amount = total_amount, Client_email = client_email)

def Payment_page(request):
    context = {}
    # context['paypal_email_receive'] = settings.PAYPAL_EMAIL_RESEIVE
    # context['paypal_client_id'] = settings.PAYPAL_CLIENT_ID
    # context['paypal_secret_id'] = settings.PAYPAL_SECRET_ID
    context['shipping_price'] = request.session['get_shipping_price']["shippmentCost"]
    context['service_name'] = request.session['get_shipping_price']["serviceName"]
    context['order'] = getOrder(request)
    return render(request, 'payment/payment.html', context)

@csrf_exempt
@require_POST
def PaymentSucess(request):
    cart = Cart(request)
    body = json.loads(request.body)
    order_id = body['order_id']
    client_email = Order.objects.get(id = order_id)
    client_email = client_email.client_email
    send_mail(
    'Client',
    'Thank You To Buying with us your Order Will Be Send Soon We Will Let You Know',
    'admin@yryrparts.com',
    [f'{client_email}'],
    fail_silently=True,
    )
    PaymentMiddleware(order_id, client_email, cart)
    return HttpResponseRedirect(reverse('Payment:success'))

def Payment_Success(request):
    cart = Cart(request)
    cart.clear()
    order_id = request.session.get("order_id")
    order = get_object_or_404(Order, id=order_id)
    return render(request, "payment/success.html", {'order': order})



