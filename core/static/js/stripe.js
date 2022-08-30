// STRIPE

var orderData = {
    items: [{ id: "products" }],
    currency: "usd",
  };

  // Disable the button until we have Stripe set up on the page
  document.getElementById("submit").disabled = true;

  fetch("../create-payment-intent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData)
  })
    .then(function(result) {
      return result.json();
    })
    .then(function(data) {
      return setupElements(data);
    })
    .then(function({ stripe, card, clientSecret }) {
      document.getElementById("submit").disabled = false;

      // Handle form submission.
      var form = document.getElementById("payment-form");
      form.addEventListener("submit", function(event) {
        event.preventDefault();
        // Initiate payment when the submit button is clicked
        pay(stripe, card, clientSecret);
      });
    });

  // Set up Stripe.js and Elements to use in checkout form
  var setupElements = function(data) {
    stripe = Stripe(data.publishableKey);
    var elements = stripe.elements();
    var style = {
      base: {
        color: "#32325d",
        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
        fontSmoothing: "antialiased",
        fontSize: "16px",
        "::placeholder": {
          color: "#aab7c4"
        }
      },
      invalid: {
        color: "#fa755a",
        iconColor: "#fa755a"
      }
    };

    var card = elements.create("card", { style: style });
    card.mount("#card-element");

    return {
      stripe: stripe,
      card: card,
      clientSecret: data.clientSecret
    };
  };

  /*
   * Calls stripe.confirmCardPayment which creates a pop-up modal to
   * prompt the user to enter extra authentication details without leaving your page
   */
  var pay = function(stripe, card, clientSecret) {
    changeLoadingState(true);

    // Initiate the payment.
    // If authentication is required, confirmCardPayment will automatically display a modal
    stripe
      .confirmCardPayment(clientSecret, {
        payment_method: {
          card: card,
          billing_details: {
            address:{
              "city": cityinput.value,
              "line1": add1input.value,
              "line2": add2input.value,
              "state": stateinput.value
            },
            email: emailinput.value
          }
        }
      })
      .then(function(result) {
        if (result.error) {
          // Show error to your customer
          showError(result.error.message);
        } else {
          // The payment has been processed!
          orderComplete(clientSecret);
        }
      });
  };

  /* ------- Post-payment helpers ------- */

  /* Shows a success / error message when the payment is complete */
  testobject = ''
  var orderComplete = function(clientSecret) {
    // Just for the purpose of the sample, show the PaymentIntent response object

    stripe.retrievePaymentIntent(clientSecret).then(function(result) {

      var paymentIntent = result.paymentIntent;
      var paymentIntentJson = JSON.stringify(paymentIntent, null, 2);

      // post data and show new page
      var form2 =document.getElementById("payload");
      var input = document.getElementById("data-payload")
      input.value = paymentIntentJson;

      form2.submit();
      changeLoadingState(false);
    });
  };

  var showError = function(errorMsgText) {
    changeLoadingState(false);
    var errorMsg = document.querySelector(".sr-field-error");
    errorMsg.textContent = errorMsgText;
    setTimeout(function() {
      errorMsg.textContent = "";
    }, 4000);
  };

  // Show a spinner on payment submission
  var changeLoadingState = function(isLoading) {
    if (isLoading) {
      document.getElementById("submit").disabled = true;
      document.querySelector("#spinner").classList.remove("hidden");
      document.querySelector("#button-text").classList.add("hidden");
    } else {
      document.getElementById("submit").disabled = false;
      document.querySelector("#spinner").classList.add("hidden");
      document.querySelector("#button-text").classList.remove("hidden");
    }
  };
  
  function showhide(object){
    if (object.hidden == false){
        object.hidden = true
    }       
    else{
        object.hidden = false
    }
           
}