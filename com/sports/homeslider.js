
goog.provide('com.cdm.sports.HomeSlider');

/**
 * @constructor
 */
com.cdm.sports.HomeSlider = function()
{
	this.init_();
}

com.cdm.sports.HomeSlider.prototype.timeout = 2000;

com.cdm.sports.HomeSlider.prototype.isHome = false;

com.cdm.sports.HomeSlider.prototype.infoHolder = null;

com.cdm.sports.HomeSlider.prototype.titleEl = null;

com.cdm.sports.HomeSlider.prototype.sectionEl = null;

com.cdm.sports.HomeSlider.prototype.dateEl = null;

com.cdm.sports.HomeSlider.prototype.readLinkEl = null;

com.cdm.sports.HomeSlider.prototype.activeSlide = null;

com.cdm.sports.HomeSlider.prototype.activeTab = null;

com.cdm.sports.HomeSlider.prototype.slides = [];

com.cdm.sports.HomeSlider.prototype.tabs = null;

com.cdm.sports.HomeSlider.prototype.init_ = function()
{
	var slideHolder, slides; 
	
	slideHolder = goog.dom.getElementsByTagNameAndClass( 'div', 'main-headlines' )[0];
	
	if( ! slideHolder )
		return;
		
	
	this.infoHolder = goog.dom.getElementsByTagNameAndClass( 'div', 'article-info', slideHolder )[0];
	this.titleEl = goog.dom.getElementsByTagNameAndClass( 'h1', null, this.infoHolder )[0];
	this.sectionEl = goog.dom.getElementsByTagNameAndClass( 'span', 'section', this.infoHolder )[0];
	this.dateEl = goog.dom.getElementsByTagNameAndClass( 'span', 'date', this.infoHolder )[0];
	this.readLinkEl = goog.dom.getElementsByTagNameAndClass( 'div', 'read-link', slideHolder )[0];
	
	this.tabs = goog.dom.getElementsByTagNameAndClass( 'div', 'tab', slideHolder );
	slides = goog.dom.getElementsByTagNameAndClass( 'div', 'slide', slideHolder );
	
	for( var i=0,j=slides.length, slide, title, href, section, date; i < j ; i++ )
	{
		slide = slides[i];
		if(i==0)
		{
			this.activeSlide = slides[i];
		}
		title = goog.dom.dataset.get( slide,'title');
		href = goog.dom.dataset.get( slide,'href');
		section = goog.dom.dataset.get( slide,'game');
		date = goog.dom.dataset.get( slide,'date');
		
		this.slides.push([title, href, section, date, slide]);
	}
	
	for( var i = 0, j = this.tabs.length, tab, slide; i < j; i++ )
	{
		tab = this.tabs[i];
		slide = this.slides[i][4];
		//console.log(tab);
		//console.log(slide);
		if(i==0)
		{
			this.activeTab = tab;
		}
		
		this.setListener( tab, slide, i )
		
	}
	
	//console.log(this.tabs);
	//console.log(this.slides);
}

com.cdm.sports.HomeSlider.prototype.setListener = function( tab, slide, num )
{
	var theSlide = this.slides[num];
	goog.events.listen( tab, goog.events.EventType.CLICK, function(e)
	{
		goog.dom.classes.remove( this.activeTab, 'active');
		goog.dom.classes.remove( this.activeSlide, 'active');
		goog.dom.classes.add( tab, 'active');
		goog.dom.classes.add( slide, 'active');
		
		this.activeTab = tab;
		this.activeSlide = slide;
		
		//console.log(tab);
		goog.dom.removeChildren( this.titleEl );
		goog.dom.removeChildren( this.sectionEl );
		goog.dom.removeChildren( this.dateEl );
		goog.dom.removeChildren( this.readLinkEl );
		this.titleEl.appendChild( goog.dom.createDom('a', {'class':'xhr','href':theSlide[1] }, theSlide[0]) );
		this.readLinkEl.appendChild( goog.dom.createDom('a', {'class':'xhr','href':theSlide[1] }, 'Read Article') );
		goog.dom.setTextContent(this.dateEl,theSlide[3]);
		goog.dom.setTextContent(this.sectionEl,theSlide[2]);
		
	}, true, this );
	
}

com.cdm.sports.HomeSlider.prototype.nextSlide = function()
{
	
}

com.cdm.sports.HomeSlider.prototype.grabElements = function()
{
	
}