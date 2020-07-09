import logging
import routes.mapper
import ckan.lib.base as base
import ckan.lib.helpers as h
import ckan.plugins as p
from ckan.lib.plugins import DefaultTranslation
import ckan.plugins.toolkit as tk
import urllib2
import urllib
from ckan.common import _, json
import collections
from pylons import config
import pylons
from ckan.common import request, c
import ckan.lib.navl as navl
import sets
import ckan
import ckan.lib.jsonp as jsonp
import ast

log = logging.getLogger(__name__)

def convert_dict_to_string(dictionary):
	return json.dumps(dictionary)

def convert_string_to_dict(string):
	# return ast.literal_eval(string)
	return json.loads(string) if string else {}

# def infograph_data(res,infograph_config):
# 	res_id = res['id']
# 	axis1 = infograph_config['axis1']
# 	axis2 = infograph_config['axis2']
# 	aggregation = infograph_config.get('aggregation','sum')
# 	# sort = infograph_config.get('sort','_id')
# 	# order = infograph_config.get('order','ASC')
# 	query = 'SELECT "'+axis1+'",'+aggregation+'("'+axis2+'") AS "'+axis2+'" FROM "'+res_id+'" WHERE "'+axis2+'" IS NOT NULL'
# 	if infograph_config.get('filter',[]):
# 		for f in infograph_config.get('filter',[]):
# 			query += ' AND (1=0'
# 			for v in f.get('values',[]):
# 				query += ' OR "'+f['column']+'" '+f.get('operator','=')+' \''+v+'\''
# 			query += ')'
# 	query += ' GROUP BY "'+axis1+'" ORDER BY "'+axis1+'"'
# 	# +' LIMIT 10'
# 	log.debug(query)
# 	url = config.get('ckan.base_url')+'/catalog/api/action/datastore_search_sql?sql='+query.replace(' ','%20')
# 	try:
# 		response = urllib2.urlopen(url)
# 		response_body = response.read()
# 	except urllib2.HTTPError as e:
# 		error_message = json.loads(e.read())
# 		return error_message
# 	except Exception, inst:
# 		msg = "Couldn't read response from datastore service %r: %s" % (response_body, inst)
# 		raise Exception, inst
# 	try:
# 		datastore = json.loads(response_body)
# 	except Exception, inst:
# 		msg = "Couldn't read response from datastore service %r: %s" % (response_body, inst)
# 		raise Exception, inst
# 	data = []
# 	for r in datastore["result"]["records"]:
# 		data.append({'axis1':r[axis1],'axis2':float(r[axis2])})
# 	return data

# def comuni():
#     response_body = ''
#     try:
#         comuni = json.loads(response_body)
#     except Exception, inst:
#         msg = "Couldn't read response from comuni service %r: %s" % (response_body, inst)
#         raise Exception, inst
#     return comuni

# def facets():
#     d = collections.OrderedDict()
#     d['organization'] = _('Organizations')
#     d['tags'] = _('Tags')
#     d['res_format'] = _('Formats')
#     d['license_id'] = _('Licenses')
#     return d

# def translate_resource_data_dict(data_dict):
#     '''Return the given dict with as many of its fields
#     as possible translated into the desired or the fallback language.

#     '''
#     try:
#         desired_lang_code = pylons.request.environ['CKAN_LANG']
#     except Exception, e:
#         desired_lang_code = 'it'

#     fallback_lang_code = pylons.config.get('ckan.locale_default', 'en')

#     # Get a flattened copy of data_dict to do the translation on.
#     flattened = navl.dictization_functions.flatten_dict(data_dict)

#     # Get a simple flat list of all the terms to be translated, from the
#     # flattened data dict.
#     terms = sets.Set()
#     for (key, value) in flattened.items():
#         if value in (None, True, False):
#             continue
#         elif isinstance(value, basestring):
#             terms.add(value)
#         elif isinstance(value, (int, long)):
#             continue
#         else:
#             for item in value:
#                  terms.add(item)

#     # Get the translations of all the terms (as a list of dictionaries).
#     translations = ckan.logic.action.get.term_translation_show(
#             {'model': ckan.model},
#             {'terms': terms,
#                 'lang_codes': (desired_lang_code, fallback_lang_code)})
#     # Transform the translations into a more convenient structure.
#     desired_translations = {}
#     fallback_translations = {}
#     for translation in translations:
#         if translation['lang_code'] == desired_lang_code:
#             desired_translations[translation['term']] = (
#                     translation['term_translation'])
#         else:
#             assert translation['lang_code'] == fallback_lang_code
#             fallback_translations[translation['term']] = (
#                     translation['term_translation'])

#     # Make a copy of the flattened data dict with all the terms replaced by
#     # their translations, where available.
#     translated_flattened = {}
#     for (key, value) in flattened.items():

#         # Don't translate names that are used for form URLs.
#         if key == ('name',):
#             if value in desired_translations:
#                 translated_flattened[key] = desired_translations[value]
#             elif value in fallback_translations:
#                 translated_flattened[key] = fallback_translations.get(value, value)
#             else:
#                 translated_flattened[key] = value

#         elif value in (None, True, False):
#             # Don't try to translate values that aren't strings.
#             translated_flattened[key] = value

#         elif isinstance(value, basestring):
#             if value in desired_translations:
#                 translated_flattened[key] = desired_translations[value]
#             else:
#                 translated_flattened[key] = fallback_translations.get(
#                         value, value)

#         elif isinstance(value, (int, long, dict)):
#             translated_flattened[key] = value

#         else:
#             translated_value = []
#             for item in value:
#                 if item in desired_translations:
#                     translated_value.append(desired_translations[item])
#                 else:
#                     translated_value.append(
#                         fallback_translations.get(item, item)
#                     )
#             translated_flattened[key] = translated_value
#     # Finally unflatten and return the translated data dict.
#     translated_data_dict = (navl.dictization_functions
#             .unflatten(translated_flattened))
#     return translated_data_dict

# def translate_resource_data_dict_list(data_dict_list):
#     translated = []
#     for dict in data_dict_list:
#         translated.append(translate_resource_data_dict(dict))
#     return translated

# def translate_related_list(related_list):
#     translated = []
#     for related in related_list:
#         dict = {'title':related.title, 'description':related.description}
#         dict_trans = translate_resource_data_dict(dict)
#         dict_trans['id'] = related.id
#         dict_trans['type'] = related.type
#         dict_trans['url'] = related.url
#         translated.append(dict_trans)
#     return translated

class LaitPlugin(p.SingletonPlugin, DefaultTranslation):
    p.implements(p.IConfigurer)
    p.implements(p.IRoutes)
    p.implements(p.ITemplateHelpers)
    p.implements(p.IResourceController, inherit=True)
    p.implements(p.IFacets)
    p.implements(p.ITranslation)
    p.implements(p.IPackageController, inherit=True)

    ## implement IPackageController.before_view
    def before_view(self, pkg_dict):
        groups = pkg_dict['groups']
        if len(groups)>0:
            context = {'model': ckan.model, 'session': ckan.model.Session,
                       'user': c.user, 'for_view': True,
                       'auth_user_obj': c.userobj, 'use_cache': False}
            for idx, group in enumerate(groups):
                data_dict = {'id': group['id']}
                try:
                    loadedGroup = ckan.logic.get_action('group_show')(context, data_dict)
                    if 'users' in loadedGroup.keys():
                        del loadedGroup['users']
                    pkg_dict['groups'][idx] = loadedGroup
                except:
                    log.info('[before_view] Error loading group: ' + groups[idx]['name'])
        else:
            log.info('[before_view] No group for dataset: ' + pkg_dict['name'])
        return pkg_dict

    def dataset_facets(self, facets_dict, package_type):
	for facet_key in facets_dict.keys():
	    if 'organization_region_' in facet_key:
                del facets_dict[facet_key]
        if 'source_catalog_title' in facets_dict.keys():
            del facets_dict['source_catalog_title']
	return facets_dict

    def group_facets(self, facets_dict, group_type, package_type):
	for facet_key in facets_dict.keys():
	    if 'organization_region_' in facet_key:
                del facets_dict[facet_key]
        if 'source_catalog_title' in facets_dict.keys():
            del facets_dict['source_catalog_title']
        return facets_dict

    def organization_facets(self, facets_dict, organization_type, package_type):
	for facet_key in facets_dict.keys():
	    if 'organization_region_' in facet_key:
                del facets_dict[facet_key]
        if 'source_catalog_title' in facets_dict.keys():
            del facets_dict['source_catalog_title']
        return facets_dict

    # def before_show(self, data_dict):
    #     translated_data_dict = translate_resource_data_dict(data_dict)
    #     return translated_data_dict

    def get_helpers(self):
        return {
        # 'translate_related_list': translate_related_list,
		# 'translate_resource_data_dict_list': translate_resource_data_dict_list,
		# 'comuni': comuni,
        # 'facets':facets,
		# 'infograph_data': infograph_data,
		'convert_string_to_dict': convert_string_to_dict,
		'convert_dict_to_string': convert_dict_to_string}

    def update_config(self, config):
        # Add this plugin's templates dir to CKAN's extra_template_paths, so
        # that CKAN will use this plugin's custom templates.
        # 'templates' is the path to the templates dir, relative to this
        # plugin.py file.
        tk.add_template_directory(config, 'templates')
        tk.add_public_directory(config, 'public')
        tk.add_resource('public', 'ckanext-lait')


    def before_map(self, route_map):
        with routes.mapper.SubMapper(route_map,
                controller='ckanext.lait.plugin:LaitController') as m:
            m.connect('translator_index', '/translator', action='translator')
            m.connect('geocoding_gazetteer', '/geocoding_gazetteer', action='geocoding_gazetteer')
        return route_map

    def after_map(self, route_map):
        return route_map


class LaitController(base.BaseController):

    def translator(self):
        context = {'model': ckan.model, 'session': ckan.model.Session,
                   'user': c.user or c.author, 'auth_user_obj': c.userobj,
                   'save': 'save' in request.params}
        try:
            ckan.logic.check_access('package_create', context)
        except ckan.logic.NotAuthorized:
            base.abort(401, _('Unauthorized to access translator'))
        return base.render('translator/index.html')

    @jsonp.jsonpify
    def geocoding_gazetteer(self):
        q = request.params.get('q', '')
        limit = request.params.get('limit', 20)
        url = config.get('ckan.base_url', '')+'/CKANAPIExtension/geocoding_gazetteer?text='+q.replace(' ', '%20')
        try:
            response = urllib2.urlopen(url)
            response_body = response.read()
        except Exception, inst:
            msg = "Couldn't connect to geocoding_gazetteer service %r: %s" % (url, inst)
            raise Exception, msg
        try:
            result= json.loads(response_body)
        except Exception, inst:
            msg = "Couldn't read response from geocoding_gazetteerservice %r: %s" % (response_body, inst)
            raise Exception, inst
        return result
