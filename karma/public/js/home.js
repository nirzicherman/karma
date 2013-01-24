var tokenTemplate;

function getTokenFromClick( ev ) {
	var element = ev.currentTarget;
	var token = $(element).parents('.karma').attr('id');
	if (token === 'this-is-a-new-token') {
		token = $('#new-token-entry').val();
		if (!token) {
			// TODO: nicer validation
			alert('hey! enter a token!');
		}
	}
	return token;
}

function postKarma( token, vote ) {

	$.ajax('/karma/'+token, {
		type: 'POST',
		data: JSON.stringify({
			'vote' : vote
		}),
		dataType: "json",
		contentType: "application/json; charset=utf-8",
		success: function( postKarmaResponse ) {

		}
	});
}

function fetchTemplates( callback ) {
	$.ajax('/html/token.html', {
		type: 'GET',
		success: function( templateString ) {
			tokenTemplate = templateString;
			if (callback) {
				callback();
			}
		}
	});
}

function bindEvents() {

	$('body')
		.delegate('.karma-plus', 'click', function( ev ) {
			var token = getTokenFromClick( ev );
			if (token) {
				postKarma( token, 1 );
			}
		})
		.delegate('.karma-minus', 'click', function( ev ) {
			var token = getTokenFromClick( ev );
			if (token) {
				postKarma( token, -1 );
			}
		});

}

function getLatestTokens() {
	$.ajax('/html/token.html', {
		type: 'GET',
		success: function( templateString ) {
			$.ajax('/recent/10', {
				type: 'GET',
				//data: data,
				success: function( getTokensResponse ) {
					var deferreds = {}, listOfDeferreds = [],
						docFrag, tokenTemplate,
						i, len, tokens = getTokensResponse.tokens;

					docFrag = document.createDocumentFragment();
					len = tokens.length;
					for (i = 0; i < len; i++) {
						deferreds[tokens[i].token] = $.Deferred();
						listOfDeferreds.push( deferreds[tokens[i].token] );
						tokenTemplate = ejs.render(templateString, tokens[i]);

						docFrag.appendChild($(tokenTemplate)[0]);

						// TODO: GIS
						deferreds[tokens[i].token].resolve();
					}

					$.when.apply($, listOfDeferreds).then(function() {
						$('#token-list').html($(docFrag));
					});

				}
			});
		}
	});

}

function init() {
	fetchTemplates(function() {
		getLatestTokens();
		bindEvents();
	});
}




// wait for DOM
var docReady = $.Deferred();

$(document).ready(docReady.resolve);


$.when(docReady).then(init);

