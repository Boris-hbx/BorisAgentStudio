/**
 * Harmony Card Transform Samples
 *
 * 样例数据服务 - 提供 UI 卡片转换的示例数据
 */

export interface CardTransformSample {
  id: string
  name: string
  description: string
  inputImage: string
  outputData: Record<string, unknown>
  outputHtml: string
  outputScreenshot: string
}

export const harmonySamples: CardTransformSample[] = [
  {
    id: 'huawei-music',
    name: '华为音乐',
    description: '音乐播放列表卡片 - 展示歌单信息和歌曲列表',
    inputImage: '/harmony-samples/huawei-music-input.png',
    outputScreenshot: '/harmony-samples/huawei-music-output.png',
    outputData: {
      data: {
        app_name: '华为音乐',
        playlist_title: '周杰伦经典精选·青春回忆歌单',
        song_count: 30,
        songs: [
          {
            title: '青花瓷',
            artist: '周杰伦',
            tags: [{ name: 'VIP' }, { name: '空间音频' }],
            cover: 'mock_image.jpg'
          },
          {
            title: '晴天',
            artist: '周杰伦',
            tags: [{ name: 'VIP' }, { name: '空间音频' }],
            cover: 'mock_image.jpg'
          },
          {
            title: '稻香',
            artist: '周杰伦',
            tags: [{ name: 'VIP' }, { name: '空间音频' }],
            cover: 'mock_image.jpg'
          }
        ]
      }
    },
    outputHtml: `<div style="display:flex;flex-direction:column;width:100%;border-radius:20px;overflow:hidden;background-color:#FFFFFF;padding:16px;box-sizing:border-box;">
  <div style="display:flex;flex-direction:row;align-items:center;margin-bottom:16px;">
    <img src="mock_image.jpg" style="width:24px;height:24px;margin-right:8px;">
    <span style="font-size:16px;color:#333333;">华为音乐</span>
  </div>
  <div style="display:flex;flex-direction:row;align-items:flex-start;margin-bottom:16px;">
    <img src="mock_image.jpg" style="width:100px;height:100px;border-radius:8px;margin-right:16px;">
    <div style="display:flex;flex-direction:column;justify-content:space-between;width:100%;">
      <span style="font-size:18px;font-weight:bold;color:#000000;margin-bottom:8px;">周杰伦经典精选·青春回忆歌单</span>
      <div style="display:flex;flex-direction:row;justify-content:space-between;width:100%;">
        <button style="padding:8px 16px;background-color:#F0F0F0;border-radius:20px;border:none;font-size:16px;color:#333333;">播放</button>
        <button style="padding:8px 16px;background-color:#1976D2;border-radius:20px;border:none;font-size:16px;color:#FFFFFF;">保存</button>
      </div>
    </div>
  </div>
  <div style="display:flex;flex-direction:row;align-items:center;margin-bottom:16px;">
    <span style="font-size:16px;color:#666666;">30首歌曲</span>
  </div>
</div>`
  },
  {
    id: 'sports',
    name: '体育赛事',
    description: 'NBA 赛程卡片 - 展示比赛信息和比分',
    inputImage: '/harmony-samples/sports-input.png',
    outputScreenshot: '/harmony-samples/sports-output.png',
    outputData: {
      data: {
        title: '体育赛程',
        more_link: '更多 >',
        games: [
          {
            sport: '篮球',
            league: 'NBA常规赛',
            date: '01月12日',
            time: '10:00',
            team_a: { name: '国王', logo: 'mock_image.jpg', score: 111 },
            team_b: { name: '火箭', logo: 'mock_image.jpg', score: 98 },
            replay: '回放'
          },
          {
            sport: '篮球',
            league: 'NBA常规赛',
            date: '01月12日',
            time: '09:30',
            team_a: { name: '勇士', logo: 'mock_image.jpg', score: 111 },
            team_b: { name: '老鹰', logo: 'mock_image.jpg', score: 124 },
            replay: '回放'
          }
        ],
        source: { data: '雷速体育', video: '腾讯体育' }
      }
    },
    outputHtml: `<div style="display:flex;flex-direction:column;width:100%;border-radius:20px;overflow:hidden;background:linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);">
  <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;padding:15px 20px;">
    <span style="color:#333333;font-size:18px;font-weight:bold;">体育赛程</span>
    <span style="color:#666666;font-size:14px;">更多 ></span>
  </div>
  <div style="display:flex;flex-direction:column;width:100%;padding:0 20px;gap:15px;">
    <!-- 比赛列表 -->
  </div>
</div>`
  },
  {
    id: 'express',
    name: '快递元服务',
    description: '快递追踪卡片 - 展示物流信息',
    inputImage: '/harmony-samples/express-input.png',
    outputScreenshot: '/harmony-samples/express-output.png',
    outputData: {
      data: {
        title: '快递元服务',
        more_text: '更多',
        deliveries: [
          {
            status: '已签收',
            phone_suffix: '3613',
            company: '京东快递',
            tracking_number: 'JD0224591058267',
            message: '您的订单已送达至【家门口】。如有疑问...',
            logo: 'mock_image.jpg'
          },
          {
            status: '已签收',
            phone_suffix: '3613',
            company: '德邦快递',
            tracking_number: 'DPK301824915427',
            message: '【深圳市】经收货人同意，此件放置在家...',
            logo: 'mock_image.jpg'
          }
        ]
      }
    },
    outputHtml: `<div style="display:flex;flex-direction:column;width:100%;border-radius:20px;overflow:hidden;background-color:#FFFFFF;">
  <div style="display:flex;flex-direction:row;justify-content:space-between;align-items:center;width:100%;padding:15px 20px;">
    <span style="font-size:18px;color:#333333;">快递元服务</span>
    <span style="font-size:16px;color:#666666;">更多</span>
  </div>
</div>`
  },
  {
    id: 'browser-news',
    name: '浏览器资讯助手',
    description: '新闻列表卡片 - 展示热点资讯',
    inputImage: '/harmony-samples/browser-news-input.png',
    outputScreenshot: '/harmony-samples/browser-news-output.png',
    outputData: {
      data: {
        news_list: [
          {
            title: '奥特曼罕见直播反思 称搞砸了GPT-5',
            source: '华尔街见闻',
            time: '17 小时前',
            image: 'mock_image.jpg'
          },
          {
            title: '我国首个星际航行学院成立',
            source: '界面新闻',
            time: '23 小时前',
            image: 'mock_image.jpg'
          },
          {
            title: '创世界纪录 我国成功研制场强35.6T全超导磁体',
            source: '央视新闻客户端',
            time: '1 天前',
            image: 'mock_image.jpg'
          }
        ]
      }
    },
    outputHtml: `<div style="display:flex;flex-direction:column;width:100%;border-radius:20px;overflow:hidden;">
  <!-- 新闻列表 -->
</div>`
  },
  {
    id: 'china-mobile',
    name: '中国移动灵犀',
    description: '视频列表卡片 - 展示体育视频集锦',
    inputImage: '/harmony-samples/china-mobile-input.png',
    outputScreenshot: '/harmony-samples/china-mobile-output.png',
    outputData: {
      data: {
        videos: [
          {
            date: '2026-01-28',
            duration: '01:39',
            title: '罗马诺·施密特门前抽射破门 但因越位进球无效',
            image: 'mock_image.jpg'
          },
          {
            date: '2026-01-28',
            duration: '00:34',
            title: '玄学！杨瀚森下场后 开拓者遭对手轰出15-0',
            image: 'mock_image.jpg'
          }
        ]
      }
    },
    outputHtml: `<div style="display:grid;grid-template-columns:repeat(2, 1fr);width:100%;border-radius:20px;overflow:hidden;">
  <!-- 视频卡片网格 -->
</div>`
  }
]
