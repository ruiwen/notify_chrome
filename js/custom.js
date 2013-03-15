
// Custom JS for Notify

var PWD_KEY = 'pwd';
var CURRENT_PWD = null;

// Capture password on submit
$('form').bind('submit', function(e) {
	var password = $('#password_action input[name=password]').val();

	// Store the password
	chrome.storage.sync.set({PWD_KEY: password}, function() {
		$('#password_success').fadeIn();
	});


	// Stop propagation and default
	e.stopPropagation();
	e.preventDefault();

	return false;
});


// Event for close button
$('button[data-dismiss="alert"]').live('click', function(e) {
	console.log(e);
	$(e.target).parent('.alert').fadeOut();
});


// On ready
$(document).ready(function() {

	// Retrieve password
	chrome.storage.sync.get(PWD_KEY, function(p) {
		if(PWD_KEY in p) {
			CURRENT_PWD = p[PWD_KEY];
			$('input[name=password]').val(CURRENT_PWD);
			$('input[type=submit]').val("Change password");
		}
		else {
			$('input[name=password]').val('');
			$('input[type=submit]').val("Set password");
		}
	});

});
