$(document).ready(function() {

  $('.dropbtn').click(function (event) {
  	event.preventDefault();
  
  	var dropDown = $(event.currentTarget).next('.dropdown-content');
  	var isOpen = false;
  
  	if ($(dropDown).hasClass('show')) {
  		isOpen = true;
  	}
  
  	closeDropDowns();
  
  	if (!isOpen) {
  		$(dropDown).toggleClass('show')
  		$(event.currentTarget).find('.caret-custom').toggleClass("caret-up");
  	}
  });



  window.onclick = function(event) {
  	if (!event.target.matches('.dropbtn') && !event.target.matches('.caret-custom')) {
  		closeDropDowns();
  	}
  }

  function closeDropDowns() {
  	var dropdowns = $(".dropdown-content");
  	var i;
  	for (i = 0; i < dropdowns.length; i++) {
  		var openDropdown = dropdowns[i];
  		if (openDropdown.classList.contains('show')) {
  			openDropdown.classList.remove('show');
  			$('.caret-custom').removeClass("caret-up");
  		}
  	}
  }


});