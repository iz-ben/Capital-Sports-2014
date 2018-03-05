/**
 * PRediction Manager
 */
goog.provide('com.cdm.sports.PredictionManager');

goog.require('goog.net.XhrManager');
goog.require('com.cdm.sports.NotificationManager');
goog.require('com.cdm.sports.Prediction');
goog.require('goog.json');

/**
 * @constructor
 */
com.cdm.sports.PredictionManager = function()
{
	this.setupSecurity();
	this.init_();
}

/**
 * @type {string}
 */
com.cdm.sports.PredictionManager.prototype.widgetIdentifierClass = 'prediction-widget';

/**
 * @type {string}
 */
com.cdm.sports.PredictionManager.prototype.predictionItemClass = 'prediction';

/**
 * @type {string}
 */
com.cdm.sports.PredictionManager.prototype.userEmail = '';


/**
 * @type {Element}
 */
com.cdm.sports.PredictionManager.prototype.submitButton = null;

/**
 * @type {Array}
 */
com.cdm.sports.PredictionManager.prototype.filledPredictions = [];

/**
 * @type {goog.net.XhrManager}
 */
com.cdm.sports.PredictionManager.prototype.xhrManager = new goog.net.XhrManager;

/**
 * @type {boolean}
 */
com.cdm.sports.PredictionManager.prototype.xhrBusy = false;


com.cdm.sports.PredictionManager.prototype.init_ = function()
{
	var widget = goog.dom.getElementByClass( this.widgetIdentifierClass ), predictions;
	
	if( ! widget )
		return;
	
	predictions = goog.dom.getElementsByTagNameAndClass( 'div', this.predictionItemClass, widget );
	
	this.submitButton = goog.dom.getElementsByTagNameAndClass( 'button', 'submit-prediction', widget )[0];
	
	for( var i = 0, j = predictions.length, prediction, predict; i < j; i++ )
	{
		prediction = predictions[i];
		
		predict = new com.cdm.sports.Prediction( prediction );
		
		goog.events.listen( predict, com.cdm.sports.Prediction.EventType.DONE, this.addPredictionItem, true, this );
		
		predict.init_();
	}
	
	goog.events.listen( this.submitButton, goog.events.EventType.CLICK, this.submitPrediction, true, this );
}

com.cdm.sports.PredictionManager.prototype.setupSecurity = function()
{
	
}

com.cdm.sports.PredictionManager.prototype.addPredictionItem = function(e)
{
	this.filledPredictions.push(e.target);	
	//console.log(this.filledPredictions);
}

com.cdm.sports.PredictionManager.prototype.submitPrediction = function()
{
	if( !this.filledPredictions.length )
	{
		com.cdm.sports.Core.notification.displayNotification('You need to make at least 1 prediction');
		return;
	}
	this.sendToDatabase();
}

com.cdm.sports.PredictionManager.prototype.sendToDatabase = function()
{
	
	console.log(this.xhrBusy);
	
	if( this.xhrBusy )
	{
		com.cdm.sports.Core.notification.displayNotification('Still processing previous request...');
		return false;
	}
	
	this.xhrBusy = true;
	
	com.cdm.sports.Core.notification.displayNotification('Sending your prediction... ');
	
	//console.log(this.filledPredictions);
	
	var predictions = [], teams = [], scores = [];
	
	for( var i =0, j = this.filledPredictions.length, /** @type { com.cdm.sports.Prediction } */prediction = null; i<j; i++ )
	{
		prediction = this.filledPredictions[i];
		//urlstr = 'team1_'+ i + '=' + team1ID
		teams.push(prediction.team1ID);
		scores.push(prediction.team1Score);
		//team = ['t[]','=', prediction.team1ID,'&amp;', 's[]','=' , prediction.team1Score ].join('');
		//predictions.push(team);
		//team = ['t[]', '=', prediction.team2ID, '&amp;','s[]','=' , prediction.team2Score ].join('');
		//predictions.push(team);
		//predictions.push( [ team1, team2 ].join('\u0002') );
	}
	
	predictions.push(teams.join());
	predictions.push(scores.join());
	//predictions.push(scores);
	console.log( predictions );
	
	var ajaxurl = cdm['ajaxurl'],
	data = goog.Uri.QueryData.createFromMap(
		new goog.structs.Map
		({
			'nonce':'',
			'action':'predict',
			'predictions':predictions.join('#')
		})
	).toString();
	
	this.xhrManager.send( 'pm', ajaxurl, 'POST', data, null, 1, goog.bind( this.processFeedback, this ) );
}

com.cdm.sports.PredictionManager.prototype.processFeedback = function(e)
{
	this.xhrBusy = false;
	
	console.log(this.xhrBusy);
	
	var xhr = e.target,
	
	error = xhr.getLastErrorCode();
	
	if( ! error)
	{
		var response = xhr.getResponseJson(),
		
		payload = response['payload'];		
		
		if( response == 0 )
		{
			console.info( cdm['messages']['xhrnotconfigured'] );
			com.cdm.sports.Core.notification.displayNotification( cdm['messages']['xhrnotconfigured'] );
			
			return;
		}
		
		if(response['status']==200)
		{
			com.cdm.sports.Core.notification.displayNotification('Your prediction has been received');
		}else if(response['status']==403)
		{
			
		}
	}
}