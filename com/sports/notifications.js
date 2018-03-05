/**
 * Notification Manager
 * responsible for displaying notification messages
 */
goog.provide('com.cdm.sports.NotificationManager');

/**
 * @constructor
 */
com.cdm.sports.NotificationManager = function()
{
	this.init_();
}

com.cdm.sports.NotificationManager.prototype.messageQueue = [];

com.cdm.sports.NotificationManager.prototype.displayClass = 'displayed';

com.cdm.sports.NotificationManager.prototype.dismissButton = null;

com.cdm.sports.NotificationManager.prototype.notificationHtmlString = '';

com.cdm.sports.NotificationManager.prototype.notificationWrapper = null;

com.cdm.sports.NotificationManager.prototype.notificationTextHolder = null;

com.cdm.sports.NotificationManager.prototype.init_ = function()
{
	this.notificationWrapper = goog.dom.createDom('div', {'id':'notification-bar'},
		goog.dom.createDom('div', {'class':'holder goog-inline-block'},
			goog.dom.createDom('div', {'class':'content goog-inline-block'},
				this.notificationTextHolder = (goog.dom.createDom('span', {'class':'notification-text'})),
				this.dismissButton = (goog.dom.createDom('a', {'class':'dismiss', 'href':'javascript:void(0)'}, 'Dismiss'))
			)
		)
	)
	
	goog.events.listen( this.dismissButton, goog.events.EventType.CLICK, this.dismissNotification, true, this );
	
	document.body.appendChild( this.notificationWrapper );
}

/**
 * @param {string=} message
 * @param {boolean=} opt_autodismiss
 */
com.cdm.sports.NotificationManager.prototype.displayNotification = function( message, opt_autodismiss )
{
	if( message )
	{
		this.messageQueue.push( message );
	}
	
	if( !this.messageQueue.length )
		return;
	
	var autodismiss = false;
	
	//this.dismissButton.style.display = 'block';
	
	if( opt_autodismiss )
	{
		
		autodismiss = opt_autodismiss;
		
		//this.dismissButton.style.display = 'none';
	}
	
	message = this.messageQueue.shift();
	
	goog.dom.setTextContent( this.notificationTextHolder, message );
	
	goog.dom.classes.add( this.notificationWrapper, this.displayClass );
	
}

com.cdm.sports.NotificationManager.prototype.dismissNotification = function()
{
	//this.messageQueue.shift();
	goog.dom.classes.remove( this.notificationWrapper, this.displayClass );
	
	if( this.messageQueue.length )
	{
		this.displayNotification();
	}
	
}

com.cdm.sports.NotificationManager.prototype.dismissAllNotifications = function()
{
	
}