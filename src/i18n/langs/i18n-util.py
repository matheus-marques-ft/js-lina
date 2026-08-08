"""
  Description: Lina i18n translation detection / update tool

  Two features:
    1. Using the zh.json file as the baseline, check whether en.json and ja.json are missing any
       translations; if so, write the missing translation entries into new files diff-zh-en.json
       and diff-zh-ja.json
    2. Directly modify the corresponding translations in diff-zh-en.json and diff-zh-ja.json, then
       run the command, and the modified translations will be written into en.json and ja.json

  Usage:
    1. Generate diff files: python i18n-util.py diff en ja
    2. Edit diff files: vi diff-zh-en.json and vi diff-zh-ja.json
    3. Update translation files: python i18n-util.py apply en ja

  Dependencies:
    pip install data-tree
    pip install pathdict

"""

import os
import json
import argparse
import data_tree
from pathdict import PathDict


actions_display_mapper = {
    'diff': 'detect',
    'apply': 'update'
}
langs_display_map = {
    'en': 'English',
    'ja': 'Japanese',
    'zh_Hant': 'Traditional Chinese',
}


class I18NFileUtil(object):
    dir_path = './src/i18n/langs'

    def diff(self, lang):
        zh_json = self.load_json(f'{self.dir_path}/zh.json')
        zh_tree = data_tree.Data_tree_node(arg_data=zh_json)
        zh_paths = list(zh_tree.paths(arg_bool_get_paths_as_strings=True))

        lang_json = self.load_json(f'{self.dir_path}/{lang}.json')
        lang_tree = data_tree.Data_tree_node(arg_data=lang_json)
        lang_paths = list(lang_tree.paths(arg_bool_get_paths_as_strings=True))

        diff_paths = set(zh_paths) - set(lang_paths)

        data = {}

        diff_filepath = f'{self.dir_path}/.diff-zh-{lang}.json'

        with open(diff_filepath, 'w', encoding='utf-8') as f:
            for path in diff_paths:
                value = zh_tree.get(path)
                if not isinstance(value, str):
                    continue
                data[path] = value
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            f.write(json_data)

            msg = f'\n' \
                  f'* Found {len(data)} untranslated entries in ./{lang}.json, ' \
                  f'the pending entries have been written to {diff_filepath}. \n'
            print(msg)

    def apply(self, lang):
        diff_filepath = f'{self.dir_path}/.diff-zh-{lang}.json'
        diff_data = self.load_json(diff_filepath)
        lang_data = self.load_json(f'{self.dir_path}/{lang}.json')

        lang_pdict = PathDict(lang_data, create_if_not_exists=True)
        for key_path, value in diff_data.items():
            lang_pdict[key_path] = value

        with open(f'{self.dir_path}/{lang}.json', 'w', encoding='utf-8') as f:
            data = self.pathdict_to_dict(lang_pdict)
            data = json.dumps(data, ensure_ascii=False, indent=2)
            f.write(data)
            print(f'\nTranslation file {self.dir_path}/{lang}.json has been updated, {len(diff_data)} new translations written in total.\n')

        # Remove the diff file
        os.remove(diff_filepath)

    def pathdict_to_dict(self, data):
        d = {}
        for k, v in data.items():
            if isinstance(v, PathDict):
                v = self.pathdict_to_dict(v)
            d[k] = v
        return d

    @staticmethod
    def load_json(filename):
        with open(filename, 'r') as f:
            data = f.read()
            return json.loads(data)


if __name__ == '__main__':

    parser = argparse.ArgumentParser(
        description="""
        Lina i18n util

        Example: \r\n

        %(prog)s diff en(ja);
        %(prog)s apply en(ja);
        """
    )
    parser.add_argument(
        'action', type=str, choices=("diff", "apply"),
    )
    parser.add_argument(
        'langs', type=str, choices=("en", "ja", "zh_Hant"), nargs='*'
    )
    args = parser.parse_args()
    action = args.action
    langs = args.langs

    util = I18NFileUtil()
    method = getattr(util, action)

    action_display = actions_display_mapper[action]
    print('-'*100)
    for index, _lang in enumerate(langs):
        lang_display = langs_display_map[_lang]
        method(_lang)
        print('-'*100)

    if action == 'diff':
        _langs = ' '.join(langs)
        msg = f'\n* Tips: after editing the diff files, run ```npm run apply-i18n ``` to update the translation files *\n'
        print(msg)

