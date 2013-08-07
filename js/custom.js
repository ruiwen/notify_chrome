
// Custom JS for Notify

var PWD_KEY = 'pwd';
var DURATION = 'duration';
var CURRENT_PWD = null;

// Capture password on submit
$('#password_action').bind('submit', function(e) {
	var password = $('#password_action input[name=password]').val();

	if(password) {
		// Store the password
		var val = {};
		val[PWD_KEY] = password;
		chrome.storage.sync.set(val, function() {
			$('#password_success').fadeIn();
			$('#password_info').hide();
		});

		// Change submit button text
		$('input[name=password_submit]').val("Change password");
	}
	else {
		$('#password_success').hide();
		$('#password_info').fadeIn();
	}

	// Stop propagation and default
	e.stopPropagation();
	e.preventDefault();

	return false;
});

// Capture settings
$('#settings').bind('submit', function(e) {
	var duration = $('#duration').val();
	duration = isNaN(duration) ? 5 : Number(duration);

	var val = {};
	val[DURATION] = duration;
	chrome.storage.sync.set(val, function() {
		$('#settings_success').fadeIn();
	});

	// Stop propagation and default
	e.stopPropagation();
	e.preventDefault();

	return false;
});

// Event for close button
$('button[data-dismiss="alert"]').live('click', function(e) {
	$(e.target).parent('.alert').fadeOut();
});


// On ready
$(document).ready(function() {

	// Retrieve password
	chrome.storage.sync.get(null, function(p) {
		if(PWD_KEY in p) {
			CURRENT_PWD = p[PWD_KEY];
			$('input[name=password]').attr("placeholder", "(hidden)");
			$('input[name=password_submit]').val("Change password");
		}
		else {
			$('input[name=password]').val('');
			$('input[name=password_submit]').val("Set password");
		}

		if(DURATION in p) {
			$('input[name=duration]').val(p[DURATION]);
		}
	});

});
