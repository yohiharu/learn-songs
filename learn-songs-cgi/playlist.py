#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import sys
sys.dont_write_bytecode = True

import cgi
import json
import os
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path


# .env をモジュールロード時に読み込む（グローバルに使うため）
def _load_env():
    env_path = Path(__file__).parent / '.env'
    if not env_path.exists():
        return
    with open(env_path, encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#') or '=' not in line:
                continue
            key, value = line.split('=', 1)
            os.environ.setdefault(key.strip(), value.strip())

_load_env()

ALLOWED_ORIGIN = os.environ.get('ALLOWED_ORIGIN', '').strip()


def send_response(status, data):
    sys.stdout.write('Status: {}\r\n'.format(status))
    sys.stdout.write('Content-Type: application/json\r\n')
    sys.stdout.write('Access-Control-Allow-Origin: {}\r\n'.format(ALLOWED_ORIGIN))
    sys.stdout.write('Access-Control-Allow-Methods: GET, OPTIONS\r\n')
    sys.stdout.write('Access-Control-Allow-Headers: Content-Type\r\n')
    sys.stdout.write('Vary: Origin\r\n')
    sys.stdout.write('\r\n')
    sys.stdout.write(json.dumps(data, ensure_ascii=False))
    sys.stdout.flush()


def main():
    method = os.environ.get('REQUEST_METHOD', 'GET')
    if method == 'OPTIONS':
        send_response(200, {})
        return

    form = cgi.FieldStorage()
    playlist_id = form.getvalue('playlistId', '').strip()

    if not playlist_id:
        send_response(400, {'error': 'playlistId パラメータが必要です'})
        return

    api_key = os.environ.get('YOUTUBE_API_KEY', '').strip()
    if not api_key:
        send_response(500, {'error': 'APIキーが設定されていません'})
        return

    items = []
    seen_ids = set()
    page_token = None

    try:
        while True:
            params = {
                'part': 'snippet',
                'maxResults': '50',
                'playlistId': playlist_id,
                'key': api_key,
            }
            if page_token:
                params['pageToken'] = page_token

            url = ('https://www.googleapis.com/youtube/v3/playlistItems?'
                   + urllib.parse.urlencode(params))

            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode('utf-8'))

            for item in data.get('items', []):
                s = item.get('snippet', {})
                title = s.get('title', '')
                if title in ('Deleted video', 'Private video'):
                    continue
                thumbnails = s.get('thumbnails', {})
                if not thumbnails.get('default'):
                    continue
                video_id = s.get('resourceId', {}).get('videoId', '')
                if not video_id or video_id in seen_ids:
                    continue
                seen_ids.add(video_id)

                thumbnail = (
                    (thumbnails.get('high') or {}).get('url')
                    or (thumbnails.get('medium') or {}).get('url')
                    or thumbnails['default']['url']
                )

                items.append({
                    'id': video_id,
                    'title': title,
                    'thumbnail': thumbnail,
                    'channelTitle': s.get('videoOwnerChannelTitle') or s.get('channelTitle') or '',
                })

            page_token = data.get('nextPageToken')
            if not page_token:
                break

        send_response(200, {'items': items})

    except urllib.error.HTTPError as e:
        try:
            err_data = json.loads(e.read().decode('utf-8'))
            msg = err_data.get('error', {}).get('message', str(e))
        except Exception:
            msg = str(e)
        send_response(e.code, {'error': msg})

    except Exception as e:
        send_response(500, {'error': str(e)})


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        # 予期せぬクラッシュ時もCORSヘッダーを必ず送出する
        send_response(500, {'error': str(e)})
