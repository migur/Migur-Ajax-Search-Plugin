/**
* @copyright	Copyright (C) 2007 Hussfelt Consulting AB. All rights reserved.
* @license		GNU/GPL, see LICENSE.php
* MigurSearch is free software. This version may have been modified pursuant
* to the GNU General Public License, and as distributed it includes or
* is derivative of works licensed under the GNU General Public License or
* other free or open source software licenses.
* See COPYRIGHT.php for copyright notices and details.
*/

/**
* MigurSearch javascript
*
* Used to process Ajax searches on a Joomla database.
*
* @author		Henrik Hussfelt <henrik@migur.com>
* @package		plg_migursearch
* @since		1.6
* @version      1.0
*/

var MigurSearch = new Class(
{
	Implements: Options,

	/**
	 *	Options, set by init script.
	 *  @type {object}
	 */
	options: {
		// Strings to provide multilingual functionality
		lang: {
			results:'Results',
			close:'Close',
			search:'Search',
			readmore:'Read more...',
			noresults:'No results.',
			advsearch:'Advanced search',
			viewall:'View all',
			totalfound: 'Total: %% results found.'
		},
		// The target to trigger search
		site_url: '',
		
		// Template to use on site_url search
		usetemplate : 'beez5',
		
		// Limit of items in result
		limit: 10,
		
		// Results ordering 
		ordering: 'newest',
		
		// The method to search
		searchphrase: 'any',
		
		// Not used. Reserved
		hide_divs: '',
		
		show_spinner: 1,
		
		// Show or not the 'advanced search' link
		show_link: 1,
		
		// Alternative 'advanced search' link
		adv_search_link: '',
		
		// Show or not the category name for each item
		show_category: 1,
		
		// Show or not the 'readmore' for each item
		show_readmore: 1,
		
		// Show or not the short part of text for each item
		show_description: 1,
		
		// Show the message if no results found
		show_no_results: 1,
		
		// Not used. Reserved
		hide_flash: 0,
		
		// Delay before sending
		delay: 200,
		// When you use useTemplateOverride=true be sure that 
		// the json.php exists in the proper template folder
		useTemplateOverride: false,
		
		// The id of DOM element
		inputFieldId: 'mod-search-searchword',
		
		// The maximum waiting time between two keydowns 
		// before the send will be executed.
		latency: 500
	},

	/**
	 *	@Initialize, set all needed values and actions.
	 *	
	 *	@param options - object, set of settings described above
	 *	@return void
	 */
	initialize: function (options) {
		this.setOptions(options);
		this.inputfield = $(this.options.inputFieldId);
		this.currentclass = '';
	},

	/**
	 *	@Fetch, fetch results from com_search.
	 *	
	 *	@return void
	 */
	fetch: function () {
		// Set new timestamp
		var curtime = new Date();
		// Globalize class.
		var migurClass = this;
		// Reset currentclass
		this.currentclass = '';
                        
		// Delete previous and create the new transport
		delete this.transport;
		this.transport = new Request.HTML({
			'url':   this.options.site_url,
			'delay': this.options.delay,
			
			/**
			 * Failure state handler
			 **/
			onFailure: function(){
				migurClass.failure();
			},
			
			/**
			 * Handler to perform something during request
			 **/
			onRequest: function(){
				migurClass.spinner(true);
			},
			
			/**
			 * Main callback to process the data when the request sucessfull
			 * 
			 * @return void
			 */
			onSuccess: function(responseTree, responseElements, responseHTML, responseJavaScript) {
                                
				var parsedData;
				var result = {};
				
				// Lets create the transitional data set used for showing the results 
				if(migurClass.options.useTemplateOverride == 1) {
					// from JSON data....
					var data = JSON.decode(responseHTML);
					parsedData = migurClass.parseJSONResult(data);
					result.countText = migurClass.options.lang.totalfound.replace('%%', data.totalFound);
				} else {
					// or from HTML responce.
					parsedData = migurClass.parseHTMLResult(responseElements);
					// Total found text from J! core
					var elementTotalFound = responseElements[0].getElementsByClassName('searchintro', 'div');
					result.countText = String.from(elementTotalFound[0].getFirst().getFirst().get('text'));
				}

				result.results = parsedData;
				
				// Let's show the results!
				migurClass.show(result);
			}
			
		// Performing the request.	
		}).post({
			'template': this.options.usetemplate,
			'tmpl': 'component',
			'option': 'com_search',
			'limit': this.options.limit,
			'ordering': this.options.ordering,
			'searchphrase': this.options.searchphrase,
			'searchword': this.inputfield.getProperty('value'),
			'time': curtime.getTime(),
			'layout': this.options.useTemplateOverride? 'json' : 'default'
		});
	},

	/**
	 *	@Spinner, show spinner.
	 *	
	 *	@param s - boolean, switcher (true - show, false - hide)
	 *	
	 *	@return void
	 */
	spinner: function (s) {
		// Setup spinner if we want to
		if (this.options.show_spinner) {
			if(s) {
				// Show the spinner
				this.inputfield.inject(new Element('span',{
					'id':'mg_spinner'
				}).set('text', '...'), 'before');
			} else if($('mg_spinner')) {
				// Remove spinner
				$('mg_spinner').destroy();
			};
		};
	},

	/**
	 *	@Failure, show failure.
	 *
	 */
	failure: function () {
		$('mg_spinner').remove();
		alert("Failure");
	},

	/**
	 * @parseHTMLResult Parse result
	 * 
	 * @param result - object, the data to parse (HTML equivavelnt)
	 * 
	 * @return array, parsed data.
	 */
	parseHTMLResult: function (result) {
		// Setup array to return
		var resultArray = new Array();

		// Get all element results
		var elementTitles = result[0].getElementsByClassName('result-title', 'dt');
		var elementCategories = result[0].getElementsByClassName('result-category', 'dd');
		var elementText = result[0].getElementsByClassName('result-text', 'dd');
		var elementCreated = result[0].getElementsByClassName('result-created', 'dd');

		for (var i=0;i<elementTitles.length;i++) {
			// Push togheter to row class
			var rowClass = {};
			// Href
			rowClass.href = elementTitles[i].getElement('a').get('href').trim().stripScripts();
			// Title
			rowClass.title = elementTitles[i].getElement('a').get('text').trim().stripScripts();
			// Text
			rowClass.text = elementText[i].get('html').stripScripts();
			// Category
			rowClass.category = elementCategories[i].getElement('span').get('text').trim().stripScripts();
			// Include in array
			resultArray.include(rowClass);
		}

		// Return array with results
		return resultArray;
	},

	/**
	 * @parseJSONResult Parse result
	 * 
	 * @param result - object, the JSON data
	 * 
	 * @return array, parsed data.
	 */
	parseJSONResult: function (result) {
		// Setup array to return
		var resultArray = new Array();
                    
		// Parse the incoming json data
		for (var i=0; i < result.elements.length; i++) {
			// Push togheter to row class
			var rowClass = {};
			// Href
			rowClass.href = result.elements[i].resultTitle.href;
			// Title
			rowClass.title = result.elements[i].resultTitle.text;
			// Text
			rowClass.text = result.elements[i].resultText.text;
			// Category
			rowClass.category = result.elements[i].resultCategory.text;
			// Include in array
			resultArray.include(rowClass);
		}

		// Return array with results
		return resultArray;
	},

	/**
	 *	@Show, show results.
 	 *	
	 *	@param res - array, the data to show
	 *	
	 *	@return void
	 */
	show: function (res) {
		// toggle spinner
		this.spinner(false);

		// Globalise class inside function
		var migurClass = this;

		// Drop the container if it exist first
		if ($('migursearch_results')) {
			$('migursearch_results').destroy();
		}        

		// if any results, create container and show)
		if(res.results.length > 0) {
                                
			// Create or empty the result container
			migurClass.prepareContainer();
                                

			// Reset row class
			this.currentclass = '';

			// Create row
			res.results.each(function(r) {
				migurClass.createRow(r);
			});

			// Setup show number of results if specified
			if(this.options.show_no_results) {
				// Add span into a, for css styleing
				$('migursearch_results').grab(new Element('div', {
					'id': 'mg_no_results'
				}).set('text', res.countText));					
			}

			// Setup advanced results link if specified
			if (this.options.show_link) {
				var a_adv_res = new Element("a", {
					'id': 'mg_adv_link'
				}).set('href', this.options.adv_search_link);
				// Add span into a, for css styleing
				a_adv_res.grab(new Element('span').set('text', this.options.lang.advsearch));
				$('migursearch_results').grab(a_adv_res.addClass('mg_adv_link'));
			};
		} else {
			// No results found, display message.
			if (this.options.show_no_results) {
				// Create or empty the result container
				migurClass.prepareContainer();
				$('migursearch_results').set('text', this.options.lang.noresults);
				$('migursearch_results').addClass('migursearch_noresults');
			}    
		}
	},
    
	/**
	 *	@prepareContainer, method to prepare the container for results (creates or recreates it).
	 *	Also positioning next down to the search input field.
	 *	
	 *	@return void
	 */
	prepareContainer: function(){
                    
		// Drop the container if it exist first
		if ($('migursearch_results')) {
			$('migursearch_results').destroy();
		}        

		// Try to get the position for box with results
		var searchInput = $(this.options.inputFieldId);
		if (!searchInput) {
			return false;
		}

		// Positioning the box. Use css to set margins.
		var coords = searchInput.getCoordinates($$('body')[0]);
		
		// Else create the div and inject into DOM
		var resultsElement = new Element("div", {
			'id': 'migursearch_results',
			'styles': {
				'position': 'absolute',
				'top':      coords.top + coords.height,
				'left':     coords.left,
				'zIndex':   '65535'
			}
		});
                        
		// Add the close button.				
		resultsElement.inject($$('body')[0], 'after');
		resultsElement.grab(
			new Element("a", {
				'id': 'migursearch_close',
				'href': '#',
				'events': {
					// Handler to hide the results box on click
					click: function(){
						$('migursearch_results').setStyles({
							'display': 'none'
						});
					}
				}
			})
		);
	},

	/**
	 *	@CreateRow, create a new result row.
	 *	
	 *	@param row - object, the data for one result
	 *	
	 *	@return void
	 */
	createRow: function (row) {
		this.currentclass = (this.currentclass == 'mg_row1' ? 'mg_row2' : 'mg_row1');
		var container = new Element('div',{
			'class': this.currentclass
		});
		// only create an a element, then clone to container
		var a_orig = new Element("a").set('href',row.href);
		var a = a_orig.clone();

		// Use clone and setup title
		a.grab(new Element("h3").set('text', row.title));

		// Setup result text div container
		var resultContainer = new Element("div", {
			'class': 'resulttext'
		});

		// Setup p tag with description, if show_description
		if (this.options.show_description) {
			resultContainer.grab(new Element("p").set('html', row.text));
		};

		// Setup second a, if readmore
		if (this.options.show_readmore) {
			var a_readmore = a_orig;
			// Add span into a, for css styleing
			a_readmore.grab(new Element('span').set('text', this.options.lang.readmore));
			resultContainer.grab(a_readmore.addClass('mg_readmore'));
		};

		// Setup section and category if we want to show these
		if (this.options.show_category) {
			// Inject into result container
			resultContainer.grab(new Element('span').addClass('mg_cat').set('text', row.category));
		};

		// Inject titletag into container
		container.grab(a);

		// Inject the result text into container, only if not empty
		if (resultContainer.get('text') != '') {
			container.grab(resultContainer);
		};

		// Inject container into result
		$('migursearch_results').grab(container);
	}
}
);

// Implement options
MigurSearch.implement(new Options);

/**
 * The class to provide the interaction between MigurSearch and 
 * events on DOM element input field
 */
var MigurSearchFire = new Class(
{
	/**
	 *	@Fire, fires the process with latency on event from DOM input field
	 *	
	 *	@param el - DOM input field
	 *	@param mgs - the MigurSearch object.
	 *	
	 *	@return void  
	 */
	fire: function(el,mgs) {
                        
		// Remove planned action
		if (this.timeout) {
			clearTimeout(this.timeout);
		}
                            
		// Add new one. 
		// The request will be sended in [MigurSearch.latency] miliseconds
		this.timeout = setTimeout(
			function(){
				mgs.fetch.call(mgs, el);
			},
			mgs.options.latency
		);
	}
}
);

window.addEvent('domready', function() {

	// Main initialization of plugin on client side when page loaded.
	var MigurSearchClass = new MigurSearch(MigurSearchOptions);
	var MigurSearchFireClass = new MigurSearchFire;
	$(MigurSearchOptions.inputFieldId).onkeyup = function(){
		if($(MigurSearchOptions.inputFieldId).getProperty('value').length > 3) {
			MigurSearchFireClass.fire(this, MigurSearchClass);
		}
	};
});