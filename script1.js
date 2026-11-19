// Clash Verge Rev 訂閱擴展腳本。使用「規則」模式。
// 在原本使用 DIRECT 的代理組選擇「直連（指定服務 IPv6 優先）」即可啟用。
function main(config) {
  const directOption = "直連（指定服務 IPv6 優先）";
  const preferredDirect = "指定服務 IPv6 優先直連";
  const directRules = "ipv6-prefer-selected-services";
  const serviceRules = "ipv6-prefer-service-matches";
  const preferIPv6ForUDP = false;

  // 包含常見的 macOS 程式與 Helper 名稱。其他服務也可由下方網域辨識。
  const processPatterns = [
    "WeChat*", "Weixin*", "QQ", "QQ Helper*", "Telegram", "Discord*",
    "NeteaseMusic*", "QQMusic*", "QQ音乐*", "Spotify*",
    "Bilibili*", "哔哩哔哩*", "Douyin*", "抖音*",
    "BaiduNetdisk*", "阿里云盘*", "AliyunDrive*"
  ];
  const appleAppPaths = [
    "/System/Applications/Music.app/*",
    "/System/Applications/TV.app/*",
    "/System/Applications/Podcasts.app/*"
  ];
  const domainSuffixes = [
    // 音樂與播客
    "music.163.com", "music.126.net", "music.qq.com", "y.qq.com",
    "spotify.com", "scdn.co", "spotifycdn.com", "spotifycdn.net",
    "music.apple.com", "podcasts.apple.com",
    // 影片與直播
    "bilibili.com", "bilivideo.com", "bilivideo.cn", "biliapi.net",
    "douyin.com", "douyinvod.com", "iesdouyin.com",
    "iqiyi.com", "qiyipic.com", "youku.com", "ykimg.com", "v.qq.com",
    "youtube.com", "googlevideo.com", "ytimg.com", "twitch.tv", "ttvnw.net",
    "netflix.com", "nflxvideo.net", "tv.apple.com",
    // 網盤
    "pan.baidu.com", "baidupcs.com", "aliyundrive.com", "alipan.com"
  ];

  const preferredRules = [
    ...domainSuffixes.map(domain => `DOMAIN-SUFFIX,${domain},${preferredDirect}`),
    ...processPatterns.map(pattern => `PROCESS-NAME-WILDCARD,${pattern},${preferredDirect}`),
    ...appleAppPaths.map(path => `PROCESS-PATH-WILDCARD,${path},${preferredDirect}`)
  ];

  const proxies = config.proxies || [];
  const groups = config["proxy-groups"] || [];
  const subRules = config["sub-rules"] || {};
  // 避免重複套用時插入同名節點或覆蓋使用者的子規則。
  const policyNames = [directOption, preferredDirect];
  const ruleNames = [directRules, serviceRules];
  if ([...proxies, ...groups].some(policy => policyNames.includes(policy.name)) ||
      ruleNames.some(name => Object.prototype.hasOwnProperty.call(subRules, name))) {
    return config;
  }

  config.proxies = [
    ...proxies,
    { name: preferredDirect, type: "direct", "ip-version": "ipv6-prefer" },
    { name: directOption, type: "rematch", "target-sub-rule": directRules }
  ];
  const selectedRules = preferIPv6ForUDP
    ? preferredRules
    : [`SUB-RULE,(NETWORK,tcp),${serviceRules}`];
  config["sub-rules"] = { ...subRules, [directRules]: [...selectedRules, "MATCH,DIRECT"] };
  if (!preferIPv6ForUDP) {
    config["sub-rules"][serviceRules] = preferredRules;
  }

  config["proxy-groups"] = groups.map(group => {
    if (group.type !== "select" || !Array.isArray(group.proxies) ||
        !group.proxies.includes("DIRECT")) {
      return group;
    }
    return { ...group, proxies: [...group.proxies, directOption] };
  });

  // 保留原本的規則順序、解析參數及局域網直連。只調整明確指向 DIRECT 的出站。
  config.rules = (config.rules || []).map(rule => {
    if (/^(?:GEOIP|GEOSITE)\s*,\s*private\s*,/i.test(rule)) {
      return rule;
    }
    return rule.replace(/,\s*DIRECT(?=\s*(?:,\s*(?:no-resolve|src)\s*)*$)/, `,${directOption}`);
  });
  return config;
}