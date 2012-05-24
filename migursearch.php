<?php

/**
 * Migur Ajax Search Plugin
 * 
 * @version		$Id: migursearch.php $
 * @package		Joomla
 * @subpackage	Content
 * @copyright	Copyright (C) 2011 Migur Ltd. All rights reserved.
 * @license		GNU/GPL, see LICENSE.php
 */
// Check to ensure this file is included in Joomla!
defined('_JEXEC') or die;

jimport('joomla.plugin.plugin');

/**
 * Migur Ajax Search Plugin
 *
 * @package		Joomla
 * @subpackage	Content
 * @since 		1.6
 */
class plgContentMigursearch extends JPlugin
{
	/**
	 * Plugin that enhances the core Joomla! Search field and gives Ajax results
	 * 
	 * @param $subject
	 * @param $config - array - config data of plugin
	 * 
	 * @return void
	 */
	public function plgContentMigursearch($subject, $config)
	{
		parent::__construct($subject, $config);

		// No need to use plugin in admin side
		if (JFactory::getApplication()->isAdmin()) {
			return;
		}
		
		// First, load mootools
		JHTML::_("behavior.mootools");

		// Get document
		$doc = JFactory::getDocument();
		$pars = !empty($this->params) ? $this->params : new JRegistry;

		// Add any parameters we need
		$js = "
			var MigurSearchOptions = {
			site_url: '" . JURI::base() . "',
				usetemplate: '" . $this->getTemplateName($pars->get('usetemplate')) . "',    
				limit: '" . $pars->get('limit') . "',
				ordering: '" . $pars->get('ordering') . "',
				searchphrase: '" . $pars->get('searchphrase') . "',
				show_spinner: " . (int) $pars->get('showspinner') . ",
				show_link: " . (int) $pars->get('showlink') . ",
				adv_search_link: '" . $pars->get('advsearchlink') . "',
				show_category: " . (int) $pars->get('showcategory') . ",
				show_readmore: " . (int) $pars->get('showreadmore') . ",
				show_description: " . (int) $pars->get('showdescription') . ",
				show_no_results: " . (int) $pars->get('shownoresults') . ",
				show_results: " . (int) $pars->get('showresults') . ",
				hide_flash: " . (int) $pars->get('hideflash') . ",
				delay: " . (int) $pars->get('delay') . ",
				useTemplateOverride: " . (int) $pars->get('usetemplateoverride') . ",
				inputFieldId: '" . $pars->get('inputfieldid') . "',
				latency: " . (int) $pars->get('latency') . ",
				responseType: '" . $pars->get('responsetype') . "'
			}";
		// Set the inline script
		$doc->addScriptDeclaration($js);

		// Add script
		$doc->addScript(JURI::root() . "media/plg_migursearch/migursearch.min.js");

		// Add CSS
		$doc->addStyleSheet(JURI::root() . "media/plg_migursearch/migursearch.css");
	}

	/**
	 * Uses to retrieve the name of template
	 * 
	 * @param  type $id - the id of tamplate in DB table.
	 * 
	 * @return string - the name of template
	 */
	public function getTemplateName($id)
	{
		// Get Dbo adapter and fetch the data by template id
		$dbo = JFactory::getDbo();
		$query = $dbo->getQuery(true);
		$query->select('*');
		$query->from('#__template_styles');
		$query->where('id=' . (int) $id);
		
		$data = $dbo->setQuery($query)->loadAssoc();
		
		return $data['template'];
	}

}

