// Add event listener to all buy buttons
document.querySelectorAll('.buy-button').forEach(button => {
    button.addEventListener('click', function () {
      // Get product details from button
      const itemId = this.getAttribute('data-item-id');
      const itemName = this.getAttribute('data-item-name');
      const itemPrice = this.getAttribute('data-item-price');
  
      // Set the modal's fields with the product data
      document.getElementById('item-id').innerHTML = itemId;
      document.getElementById('item-name').innerHTML = itemName;
      document.getElementById('item-price').innerHTML = '£' + itemPrice;
    });
  });
  