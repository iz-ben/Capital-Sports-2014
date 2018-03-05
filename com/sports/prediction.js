/**
 * PRediction Manager
 */
goog.provide('com.cdm.sports.Prediction');

goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.ui.Component.EventType');
goog.require('goog.ui.FlatMenuButtonRenderer');
goog.require('goog.ui.Option');
goog.require('goog.ui.Select');
goog.require('goog.ui.Separator');
goog.require('goog.ui.decorate');

/**
 * @param {Element} wrapper
 * @constructor
 * @extends {goog.events.EventTarget}
 */
com.cdm.sports.Prediction = function( wrapper )
{
	this.predictionWrapper = wrapper;
}

goog.inherits( com.cdm.sports.Prediction, goog.events.EventTarget );

/**
 * @enum {string}
 */
com.cdm.sports.Prediction.EventType = {
  CHANGE: 'change',
  DONE: 'done'
};

/**
 * @type {string}
 */
com.cdm.sports.Prediction.prototype.team1IdentifierClass = 'team-a';

/**
 * @type {string}
 */
com.cdm.sports.Prediction.prototype.team2IdentifierClass = 'team-b';


/**
 * @type {Element}
 */
com.cdm.sports.Prediction.prototype.predictionWrapper = null;

/**
 * @type {Element}
 */
com.cdm.sports.Prediction.prototype.team1ScoreLabel = null;

/**
 * @type {Element}
 */
com.cdm.sports.Prediction.prototype.team2ScoreLabel = null;

/**
 * @type {Element}
 */
com.cdm.sports.Prediction.prototype.team1PickerContainer = null;

/**
 * @type {Element}
 */
com.cdm.sports.Prediction.prototype.team2PickerContainer = null;

/**
 * @type {number}
 */
com.cdm.sports.Prediction.prototype.team1Score = 0;

/**
 * @type {number}
 */
com.cdm.sports.Prediction.prototype.team2Score = 0;

/**
 * @type {number}
 */
com.cdm.sports.Prediction.prototype.team1ID = 0;

/**
 * @type {number}
 */
com.cdm.sports.Prediction.prototype.team2ID = 0;

/**
 * @type {goog.ui.Select}
 */
com.cdm.sports.Prediction.prototype.team1ScorePicker = null;

/**
 * @type {goog.ui.Select}
 */
com.cdm.sports.Prediction.prototype.team2ScorePicker = null;

/**
 * @type {boolean}
 */
com.cdm.sports.Prediction.prototype.selectionMade = false;

/**
 * @type {boolean}
 */
com.cdm.sports.Prediction.prototype.selection1Made = false;

/**
 * @type {boolean}
 */
com.cdm.sports.Prediction.prototype.selection2Made = false;


com.cdm.sports.Prediction.prototype.init_ = function()
{
	var teamEls = goog.dom.getElementsByTagNameAndClass( 'div', 'team', this.predictionWrapper );
	
	for( var i = 0, j = teamEls.length, el, id, scoreLabel, pickerContainer; i<j; i++ )
	{
		el = teamEls[i];
		
		id = parseInt( goog.dom.dataset.get( el, 'id' ), 10 );
		
		//console.log(id);
		
		scoreLabel = goog.dom.getElementByClass( 'score-label', el );
		
		pickerContainer = goog.dom.getElementByClass( 'score-selector', el );
		
		if(i==0)
		{
			this.team1ScoreLabel = scoreLabel;
			this.team1PickerContainer = pickerContainer;
			this.team1ID = id;
		}else if(i==1)
		{
			this.team2ScoreLabel = scoreLabel;
			this.team2PickerContainer = pickerContainer;
			this.team2ID = id;
		}
	}
	
	this.team1ScorePicker = new goog.ui.Select();
	
	this.team2ScorePicker = new goog.ui.Select();
	
	for( var i = 0, num; i < 11; i++ )
	{
		num = i.toString();
		
		this.team1ScorePicker.addItem( new goog.ui.Option( num ) );
		
		this.team2ScorePicker.addItem( new goog.ui.Option( num ) );
		
	}
	
	goog.events.listen( this.team1ScorePicker, goog.ui.Component.EventType.ACTION,
	function(e)
	{
		var select = e.target,
		
		scoreValue = select.getValue();
		
		this.team1Score = scoreValue;
		
		goog.dom.setTextContent( this.team1ScoreLabel, scoreValue );
		
		if( !this.selection1Made && this.selection2Made )
		{
			this.dispatchEvent( com.cdm.sports.Prediction.EventType.DONE );
			
			this.selectionMade = true;
		}
		this.selection1Made = true;
	}, true, this);
	
	goog.events.listen( this.team2ScorePicker, goog.ui.Component.EventType.ACTION,
	function(e)
	{
		var select = e.target,
		
		scoreValue = select.getValue();
		
		this.team2Score = scoreValue;
		
		goog.dom.setTextContent( this.team2ScoreLabel, scoreValue );
		
		if( this.selection1Made && !this.selection2Made)
		{
			this.dispatchEvent(com.cdm.sports.Prediction.EventType.DONE);
			
			this.selectionMade = true;
		}
		
		this.selection2Made = true;
		
		
	}, true, this);
	
	this.team1ScorePicker.render( this.team1PickerContainer );
	
	this.team2ScorePicker.render( this.team2PickerContainer );
}

com.cdm.sports.Prediction.prototype.resetPrediction = function()
{
	
}


