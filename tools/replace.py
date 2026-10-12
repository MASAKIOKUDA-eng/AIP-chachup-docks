# 文字列の置換を一括で行う補助スクリプト: python3 tools/replace.py <ファイル> <置換表.json>
# 置換表は [[置換前, 置換後], ...]。置換前が見つからない場合はエラーにする
import json, sys
path, table = sys.argv[1], sys.argv[2]
s = open(path, encoding="utf-8").read()
for a, b in json.load(open(table, encoding="utf-8")):
    if a not in s:
        sys.exit("見つかりません: " + a[:40])
    s = s.replace(a, b)
open(path, "w", encoding="utf-8").write(s)
