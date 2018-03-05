/**
 * Responsible for the asynchronous load and display of pages, and updating the browser history 
 */
goog.provide('com.cdm.sports.PageManager');

goog.require('goog.Timer');
goog.require('goog.array');
goog.require('goog.events');
goog.require('goog.events.EventType');
goog.require('goog.events.KeyCodes');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.dom');
goog.require('goog.dom.selection');
goog.require('goog.dom.dataset');
goog.require('goog.history.Html5History');
goog.require('goog.Uri');
goog.require('goog.net.Cookies');
goog.require('goog.net.XhrManager');
goog.require('goog.string');
goog.require('goog.ui.ScrollTo');

goog.require('com.cdm.sports.Article');
goog.require('com.cdm.sports.Page');
goog.require('com.cdm.sports.Settings');

/**
 * @constructor
 */
com.cdm.sports.PageManager = function()
{
	this.setupSecurity();
	this.init();
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.DISABLEXHR, this.disable, true, this );
	goog.events.listen( com.cdm.sports.Core.settings, com.cdm.sports.Settings.EventType.ENABLEXHR, this.enable, true, this );
}

/**
 * Rough skeleton of the properties and methods
 * Properties
 		current document title
		current document url
		overlay element reference
		close button reference
		section( capital site )
		cache
		the page/article instance
		history manager
		scroll manager
 * Methods
 		init
		load page
		setup blank page template
		restore page
		close open page
		parse tags for twitter
		update history
		restore history
		track page view
		refresh page manager
 */
 
com.cdm.sports.PageManager.popularArticles = [];

com.cdm.sports.PageManager.nonces = {}
/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.originalTitle = document.title;

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.originalUrl = document.location.href;

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.basePath = '';

/**
 * @type {goog.Uri}
 */
com.cdm.sports.PageManager.prototype.baseUrl = new goog.Uri( cdm['settings']['baseurl'] );

/**
 * @type {string|null}
 */
com.cdm.sports.PageManager.prototype.pageTitle = null;

/**
 * @type {number|null}
 */
com.cdm.sports.PageManager.prototype.postID = null;

/**
 * @type {number|null}
 */
com.cdm.sports.PageManager.prototype.currentScrollY = 0;

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.linkEl = null;

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.permalink = '';

/**
 * @type {string|null}
 */
com.cdm.sports.PageManager.prototype.activePermalink = null;

/**
 * @type {Array}
 */
com.cdm.sports.PageManager.prototype.dependencies = [];

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.mainContent = null;

/**
 * @type {Element}
 */
com.cdm.sports.PageManager.prototype.documentBody = null;

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.innerpageWrapper = null;

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.innerpage = null;

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.overlayBackground = null;

/**
 * @type {Element|null}
 */
com.cdm.sports.PageManager.prototype.closeButton = null;


/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.section = ''

/**
 * @type {Array}
 */
com.cdm.sports.PageManager.prototype.articleCache = [];


/**
 * @type {boolean}
 */
com.cdm.sports.PageManager.prototype.isPage = false;

/**
 * @type {com.cdm.sports.Page|null}
 */
com.cdm.sports.PageManager.prototype.page = null;



/**
 * @type {com.cdm.sports.Article|null}
 */
com.cdm.sports.PageManager.prototype.article = null;

/**
 * @type {goog.history.Html5History}
 */
com.cdm.sports.PageManager.prototype.history = null;

/**
 * @type {Array}
 * We need to keep track of all listeners for garbage collection 
 * especially where there is direct navigation between articles.
 */
com.cdm.sports.PageManager.prototype.listeners = [];

/**
 * @type {goog.ui.ScrollTo}
 */
com.cdm.sports.PageManager.prototype.scrollManager = new goog.ui.ScrollTo;

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.dockedClass = 'docked';

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.busyClass = 'working';

/**
 * @type {string}
 */
com.cdm.sports.PageManager.prototype.openArticleClass = 'article-open';

/**
 * 
 */
com.cdm.sports.PageManager.prototype.init = function()
{
	if( ! com.cdm.sports.Core.settings.xhrLoading )
		return;
	//History
	try
	{
		this.history = new goog.history.Html5History();
		
	} catch (e)
	{
	  console.log(e.message);
	}
	if( this.history )
	{
		
		this.history.setUseFragment(false);
		
		//console.log(cdm['settings']['baseurl']);
		
		this.basePath = this.baseUrl.getPath();
		
		this.history.setPathPrefix( this.basePath );
		
		goog.events.listen( this.history, goog.history.EventType.NAVIGATE, this.processHistory, true, this );
		
		this.history.setEnabled(true);	
	}
	
	//Identify the dom elements we'll be using
	this.grabElements();
	
	var windowListener = goog.events.listen( window, goog.events.EventType.SCROLL, this.trackScroll, true, this);
	this.listeners.push(windowListener);
	var linkListener = goog.events.listen( document, goog.events.EventType.CLICK,function(e)
	{
		e = e || window.event;
		
		var target = e.target || e.srcElement,
		
		dependencies,
		
		capture = false;
		
		if ( target.nodeName !== 'A')
			this.linkEl = goog.dom.getAncestorByTagNameAndClass( target, 'a', null );
		else
			this.linkEl = target;
		
		//console.log(this.linkEl.href);
		
		if( this.linkEl && goog.dom.classes.has( this.linkEl, 'xhr') )
		{
			e.preventDefault();
			
			this.pageName =  goog.dom.dataset.get(this.linkEl,'template');
			
			this.permalink = /** @type {string }*/(this.linkEl.href);
			
			//console.log({'permalink':this.permalink});
			
			if( this.pageName && '' !== this.pageName )
			{
				dependencies = goog.dom.dataset.get(this.linkEl,'dependency');
				//console.log(dependencies);
				if( dependencies )
				{
					this.dependencies = dependencies.split(',');
					//console.log(this.dependencies);
				}
				
				this.isPage = true;
			}
			
			
			if( ! this.isPage )
			{
				if( this.activePermalink == this.permalink )
				{
					return false;
				}
				//console.log(this.linkEl.href);
				
				this.displayPage();
				
				
				
				return;
				
			}
		}
		
		return false;
		
		
	}, true, this );
	
	
	this.listeners.push(linkListener);
	
	if( cdm['settings']['issingle'])
	{
		this.originalTitle = cdm['title'];
		this.singlePageOverride();
	}
	
	//console.log(this.listeners);
}


com.cdm.sports.PageManager.prototype.setupSecurity = function()
{
	var nonces = cdm['settings']['csrf'];
	
	com.cdm.sports.PageManager.nonces.single = nonces['single'];
}
/**
 * 
 */
com.cdm.sports.PageManager.prototype.displayPage = function()
{
	if( ! com.cdm.sports.Core.settings.xhrLoading )
		return;
		
	this.prepStage();
	
	//if( this.page )
	//{
		//this.page.close();
	//}
	
	if( this.article )
	{
		//remove all listeners since ideally we're gonna forget this article existed
		goog.events.removeAll( this.article ) ;
		//the browser's garbage collection will take it from here
		this.article = null;
	}
	
	
	
	this.displaySpinner();
	
	if( this.isPage )
	{
		
	}else
	{
		
		//console.log({'displaypage':this.permalink});
		this.article = new com.cdm.sports.Article( this.permalink, this.articleCache );
		
		//this.listeners.push( this.article );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.CLOSE, this.restore, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.OPEN, this.trackView, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.OPEN, this.updateHistory, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.CLOSE, this.restoreHistory, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.OPEN, function(e)
		{
			this.updateViews( this.article.postID );
		}, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.OPEN, this.hideSpinner, true, this );
		
		goog.events.listen(this.article,com.cdm.sports.Article.EventType.OPEN, function()
		{
			
			this.writeToDom(this.article.html);
			
			document.title = this.pageTitle = goog.string.unescapeEntities( this.article.pageTitle );
			//console.log(this.pageTitle);
			this.activePermalink = this.permalink;
			
			goog.dom.classes.add( this.innerpageWrapper, this.openArticleClass );
			
			//window.scrollTo( 0, 0);
			//console.log({'articleOpen':this.currentScrollY});
			
		}, true, this)
		
		/**
		 * Error handling
		 */
		goog.events.listen(this.article,[ com.cdm.sports.Article.EventType.NOTFOUND, com.cdm.sports.Article.EventType.ERROR, com.cdm.sports.Article.EventType.CONNECTIONERROR ], this.displayErrorMessage, true, this);
		
		
		this.article.init_();
		
	}
	
}
/**
 * @param {Element} html
 */
com.cdm.sports.PageManager.prototype.writeToDom = function( html )
{
	this.innerpage.appendChild( html );
	
	/* Uncomment if you intend to use the Disqus commenting platform */
	//this.parseComments();
	
	this.parseInnerAdverts();
	
	this.parseSharingTags();
	
}

com.cdm.sports.PageManager.prototype.displayErrorMessage = function( e )
{
	var errorhtmlstr;
	
	this.hideSpinner();
	
	//console.log(e.type);
	
	switch( e.type )
	{
		case com.cdm.sports.Article.EventType.ERROR:
			this.writeToDom( /** @type {Element}*/( goog.dom.htmlToDocumentFragment( cdm['templates']['articleerror'] ) ) );
			break;
		case com.cdm.sports.Article.EventType.NOTFOUND:
			
			break;
		case com.cdm.sports.Article.EventType.CONNECTIONERROR:
			
			break;
		default:
			break;
	}
}

com.cdm.sports.PageManager.prototype.grabElements = function()
{
	var contentholdername = 'main',
		
	innerpageWrapperName = 'innerpage-wrapper', 
	
	innerpageName = 'innerpage';
	
	this.documentBody = document.body;
	
	this.mainContent = goog.dom.getElement( contentholdername );
	
	this.innerpageWrapper = goog.dom.getElement( innerpageWrapperName ),
	
	this.innerpage = goog.dom.getElement( innerpageName );
	
	this.closeButton = goog.dom.getElementByClass( 'close-page', this.innerpageWrapper );
	
	this.overlayBackground = goog.dom.getElementByClass( 'page-overlay', this.innerpageWrapper );
	
	goog.events.listen( this.closeButton, goog.events.EventType.CLICK, this.closePage, false, this );
		
	goog.events.listen( this.overlayBackground, goog.events.EventType.CLICK, this.closePage, false, this );
	
	var shortcut = new goog.ui.KeyboardShortcutHandler(document);
	
	shortcut.registerShortcut('ESC', goog.events.KeyCodes.ESC);//ESC Key
	
	//var shorcutKeyListener = goog.events.listenOnce( shortcut, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,        this.closePage, true, this);
	var shorcutKeyListener = goog.events.listen( shortcut, goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
        this.closePage, true, this);		
	
}
/**
 * 
 */
com.cdm.sports.PageManager.prototype.prepStage = function()
{
	if( ! this.article )
	{
		this.currentScrollY = window.pageYOffset;
	}
	
	goog.dom.classes.add( this.documentBody, this.dockedClass ); 
	
	goog.dom.classes.add( this.mainContent, this.dockedClass ); 
	
	this.innerpageWrapper.style.display = 'block';
	
	goog.dom.removeChildren( /** @type {Node} */( this.innerpage ) );	
	
	goog.events.unlisten( window, goog.events.EventType.SCROLL, {} );
			
	this.scrollManager.scroll(0);
	
	goog.dom.classes.remove( this.innerpageWrapper, this.openArticleClass );
	
	//console.log(this.currentScrollY);
	
}


/**
 * 
 */
com.cdm.sports.PageManager.prototype.closePage = function()
{
	if( this.page )
	{
		this.page.close();
		
	}else if( this.article )
	{
		this.article.close();
	}
	else
	{
		this.restore();
	}
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.restore = function()
{
	goog.dom.classes.remove( this.documentBody, this.dockedClass ); 
	
	goog.dom.classes.remove( this.mainContent, this.dockedClass ); 
	
	this.innerpageWrapper.style.display = 'none';
	
	goog.dom.removeChildren( /** @type {Node} */( this.innerpage ) );
	
	goog.dom.classes.remove( this.innerpageWrapper, this.openArticleClass );
		
	/**
	 * Reset all properties to their default state
	 */
	this.isPage = false;
	
	this.pageTitle = null;
	
	this.postID = null;
	
	this.linkEl = null;
	
	//this.permalink = '';
	
	this.activePermalink = null;
	
	this.dependencies = [];
	
	this.page = null;
	
	this.article = null;
	
	this.section = '';
	
	document.title = this.originalTitle;

	/*
	goog.events.listenOnce( this.scrollManager, goog.ui.ScrollTo.EventType.FINISH, function(e)
	{
		goog.events.listen( window, goog.events.EventType.SCROLL, this.trackScroll, true, this);
	}, true, this);
	
	*/
	
	this.scrollManager.scroll( this.currentScrollY );
	
	//console.log({'articleClose':this.currentScrollY, 'type':typeof this.currentScrollY});

}



/**
 * So, this part is self explanatory, right?
 */
com.cdm.sports.PageManager.prototype.singlePageOverride = function()
{
	//console.log('override active');
	
	var article = window['cdms'],
	
	innercontent;
	
	this.permalink = article[5];
	
	this.articleCache[ this.permalink ] = article;
	
	this.displayPage();
	
	innercontent = /** @type {Node}*/( goog.dom.getElement( 'content' ) );	
	
	goog.dom.removeChildren( innercontent );
	
	goog.dom.appendChild( innercontent, goog.dom.htmlToDocumentFragment( cdm['templates']['home']  ) );
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.updateHistory = function()
{
	if( ! this.history )
		return;
	
	//console.info( this.article );
	
	var uri = new goog.Uri( this.article.permalink ),
	
	urifragment = uri.getPath(),
	
	control, fragmentParams = [], permalink;
	
	urifragment = urifragment.replace( this.basePath , '' ),
	
	permalink = cdm['settings']['permalink'];
	
	control = urifragment.split('/');
	
	goog.array.forEach( control, function( paramItem )
	{
		if( ''!==paramItem.toString().trim())
			fragmentParams.push( paramItem )
	})
	
	//console.log( {'control':fragmentParams.length,'permalink':permalink.length})
	if( control.length < permalink.length )
		return;
	
	//console.log(control);
	 
	//console.info( urifragment );
	
	//console.info( this.basePath );
	
	this.history.setToken( urifragment, this.article.pageTitle);
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.restoreHistory = function()
{
	if( ! this.history )
		return;
	console.info( 'history restore' );
	var uri = new goog.Uri( this.originalUrl ),
	
	urifragment = uri.getPath(),
	
	control, fragmentParams = [], permalink;
	
	urifragment = urifragment.replace( this.basePath , '' )//, permalink = cdm['settings']['permalink'];
	
	this.history.setToken( urifragment, this.originalTitle );
}

/**
* This will handle browser navigation events.
* Ideally we want to capture all single articles but allow everything else to navigate naturally
*/


com.cdm.sports.PageManager.prototype.processHistory = function(e)
{
	if( ! e.isNavigation )
		return;
		
	//console.log(e.token);
	
	if(e.token == '' || e.token == '/')
	{
		this.closePage();
		return;
	}
	
	var urifragment = e.token.replace( this.basePath , '' ),
	
	permalink = cdm['settings']['permalink'],
	
	control = urifragment.split('/'),
	
	fragmentParams = [];
	
	goog.array.forEach( control, function( paramItem )
	{
		if( ''!==paramItem.toString().trim())
			fragmentParams.push( paramItem )
	})
	
	console.log( {'control':fragmentParams.length,'permalink':permalink.length})
	if( fragmentParams.length < permalink.length )
	{
		this.closePage();
		return;
	}
	
	this.permalink = [ this.baseUrl.toString(), e.token ].join('');
	
	//console.log({'history permalink':this.permalink});
	
	this.displayPage();
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.trackView = function()
{
	try
	{
		_gaq.push( [ '_trackPageview', this.permalink ] );
		_gaq.push( [ this.section + '._trackPageview', this.permalink ] );
		_gaq.push( [ '_trackEvent', 'click', this.section, this.permalink ] );
	}
	catch(e)
	{
		console.log(cdm['messages']['trackingerror']);
	}
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.refreshManager = function()
{
	
}

com.cdm.sports.PageManager.prototype.trackScroll = function()
{
	if( ! this.page && ! this.article )
	{
		this.currentScrollY = window.pageYOffset;
	}
}


com.cdm.sports.PageManager.prototype.parseComments = function()
{
	//console.log( this.article );
	try
	{
	if( DISQUS && this.article )
	{
		var permalink = this.permalink,
		
		identifier =[this.baseurl, this.section, '?p='+this.article.postID ].join('/'),
		
		articleTitle = this.article.pageTitle;
		
		//console.log({'permalink':permalink,'identifier':identifier,'title':articleTitle});
		
		DISQUS.reset(
		{
			'reload': true,
			'config': function ()
			{
				this['page']['identifier'] = identifier;
				this['page']['url'] = permalink;
				this['page']['title'] = articleTitle;
			}
		});
	}
	}catch(err)
	{
		console.log(err.message)
	}
}


com.cdm.sports.PageManager.prototype.parseSharingTags = function()
{
	/**
	 * This way only the network whose sdk isn't loaded will break
	 */
	var networks = cdm['settings']['rendertags'];
	for(var i =0, j = networks.length; i < j ; i++ )
	{
		try
		{
			eval(networks[i]);
		}catch(err)
		{
			console.log(err.message)
		}
	}
}

com.cdm.sports.PageManager.prototype.parseInnerAdverts = function()
{
	try
	{
		googletag.pubads()['refresh']();
	}catch(e)
	{
		console.log(e.message);
	}
}
/**
 * Updates views in the popular posts table. 
 * Requires the popular posts plugin to be installed
 * The code in this is really hard to read i presume, since I've used local variables extensively
 */
com.cdm.sports.PageManager.prototype.updateViews = function( postID )
{
	var d = new Date(),
	wppnonce = cdm['settings']['csrf']['wpp'],
	xhrManager = new goog.net.XhrManager,
	ajaxurl = cdm['ajaxurl'],
	data = goog.Uri.QueryData.createFromMap(
		new goog.structs.Map
		({
			'token':wppnonce,
			'action':'wpp_update',
			'id':postID
		})
	).toString();
	
	xhrManager.send( ( d.getTime().toString() ), ajaxurl, 'POST', data, null, 1, goog.bind( function( e )
	{
		//do somethin here, I guess...sai sina story ya maana
	}, this ) );
}

/**
 * 
 */
com.cdm.sports.PageManager.prototype.displaySpinner = function()
{
	goog.dom.classes.add( this.innerpage, this.busyClass ); 
}

com.cdm.sports.PageManager.prototype.hideSpinner = function()
{
	goog.dom.classes.remove( this.innerpage, this.busyClass ); 
}

com.cdm.sports.PageManager.prototype.enable = function()
{
	this.init();
	//this.history.setEnabled(true);
	//console.log(this.listeners);	
	//console.info('ajax enabled PM');
}

com.cdm.sports.PageManager.prototype.disable = function()
{
	this.history.setEnabled(false);
	for( var i=0, j=this.listeners.length, listenerKey; i < j; i++ )
	{
		listenerKey = this.listeners[i];
		goog.events.unlistenByKey( listenerKey );
	}
	//console.log(this.listeners);
	this.listeners = [];
	//console.info('ajax disabled PM');
}