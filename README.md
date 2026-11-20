# Mac 串流 IPv6 優先與網易雲 CDN 設定

用 Clash Verge Rev，可以讓原本直連的網易雲、Bilibili、QQ、微信等服務優先使用 IPv6，並保留 IPv4 回退。如果網易雲的音訊 CDN 仍大量走 IPv4，可以加上 DNS 補強，再選擇是否把指定 CDN 的 TCP 連線限制為 IPv6。校園網或電信商的扣量仍須按該網路的計費口徑核對。

如果可以给个star再走吧

## 適用環境

- Mac 所在的網路可以連上公網 IPv6。示例實測環境為 Clash Verge Rev **2.5.7**、Mihomo **1.19.32**。內核需支援 `type: rematch`。
- Clash Verge 使用**規則模式**。要讓程式規則涵蓋網易雲、微信、QQ 等原生 App，示例使用 **TUN 模式**。Clash 的 IPv6 開關與有效 DNS 設定中的 `dns.ipv6` 都應開啟。 [Mihomo 模式](https://wiki.metacubex.one/en/config/general/#operation-mode) · [Rematch](https://wiki.metacubex.one/en/config/proxies/rematch/) · [DNS IPv6](https://wiki.metacubex.one/en/config/dns/#ipv6)

## 1. 加上 IPv6 優先直連

1. 在 Clash Verge 的「訂閱」頁開啟 **Global Extend Script**（全域擴充指令碼），貼上文末的**腳本 A**並儲存。若只想套用到一個訂閱，也可放到該訂閱的「擴充指令碼」。每個擴充指令碼檔案只留一個 `main()`。已有自訂內容時，先備份，再把邏輯合併到原本的 `main()`。 [Clash Verge 腳本設定](https://clashvergerev.com/zh-tw/guide/script)
2. 到「代理」頁，把原先選 `DIRECT` 的相關代理組改選 **直連（指定服務 IPv6 優先）**。例如，有些訂閱的國內網站和 Bilibili 分在兩個代理組。若某組原本用代理節點，繼續使用原先的選項即可。
3. 用一首未快取的歌或一段新影片測試。在「連線」頁看到 **指定服務 IPv6 優先直連**，就表示這條連線命中策略。接著查實際出站 IP，確認有沒有回退。

腳本以程式名稱、Apple 原生 App 路徑及服務網域辨識流量，涵蓋網易雲、QQ 音樂、Spotify、Apple Music、微信、QQ、Bilibili、抖音、YouTube、Netflix、Twitch 和常見網盤。預設只對符合條件的 TCP 直連使用 `ipv6-prefer`。原先直接指向 `DIRECT` 的規則也會套用，`GEOIP,private` 和 `GEOSITE,private` 原樣保留。 [Mihomo 路由規則](https://wiki.metacubex.one/en/config/rules/) · [IP 版本設定](https://wiki.metacubex.one/en/config/proxies/#ip-version)

## 2. 網易雲 CDN 的 DNS 補強與 IPv6 限制

網易雲的音訊檔由 CDN 提供。實測同一個 `m801.music.126.net` 在不同查詢中取得的 IPv6 記錄會變動。範例將網易雲音訊網域及幾個 CDN 別名交給兩個在測試網路中可用的公用 DNS `119.29.29.29` 和 `223.5.5.5`。建議先在自己的網路查 `AAAA`，因為不同地區或網路的結果可能不同。

```bash
dig +short AAAA m801.music.126.net
dig +short AAAA p4.music.126.net.ctlcdn.cn
```

1. 將**腳本 A**放在「全域擴充指令碼」，再把文末的**腳本 B**接在同一個檔案的結尾。把 B 開頭的 `neteaseProfileName` 換成訂閱頁顯示的名稱，兩者須完全相同。這樣訂閱更新後，可以從全域腳本重新套用。 [Clash Verge 腳本設定](https://clashvergerev.com/zh-tw/guide/script)
2. 腳本 B 預設補強 DNS，並讓 `NeteaseMusic*` 連至清單內 CDN 的 TCP 連線**只走 IPv6 直連**。如果某個 CDN 沒有可用的 IPv6，該次載入可能失敗。若想保留 IPv4 回退，把 `neteaseIPv6Only` 改成 `false`，就只套用 DNS 補強。 [Mihomo 出站 IP 版本](https://wiki.metacubex.one/en/config/proxies/#ip-version)
3. DNS 補強需要訂閱已啟用 Mihomo DNS。儲存後，在「設定 → 執行期設定」確認 `dns.nameserver-policy` 有網易雲條目，且 `direct-nameserver-follow-policy` 為 `true`。這個開關也會讓同一訂閱的直連 DNS 遵循原有的網域解析政策。若啟用了會覆蓋這些欄位的「DNS 覆寫」，把相同 DNS 規則合併到生效的 DNS 設定中。IPv6 限制啟用後，網易雲命中的連線會顯示 **網易雲 CDN IPv6 直連**。 [Mihomo DNS 直連政策](https://wiki.metacubex.one/en/config/dns/#direct-nameserver-follow-policy)

## 3. 到 Wi-Fi 介面驗證實際流量

開著 TUN 時，一條連線可以在 `utun*` 顯示 App 提交的 IPv4，再由 Mihomo 從 Wi-Fi 以 IPv6 連到同一個 CDN。只看網易雲那一列的 `tcp4`，或 Clash 裡的「目標位址」，會漏掉實際出站選到的 IP。確認方式如下。 [Mihomo 連線 API](https://wiki.metacubex.one/en/api/#connections)

```bash
networksetup -listallhardwareports
nettop -n -d -p verge-mihomo -J interface,bytes_in,bytes_out
```

先用第一行找出 Wi-Fi 的 `Device`，例如 `en0`。播放一首未快取的歌，再看第二行指令裡對應介面的 `tcp6`／`tcp4` 與 `bytes_in`。若內核程序名稱不同，把 `verge-mihomo` 換成實際名稱。要精確對照到單條 App 連線，可在 Mihomo 的 `/connections` 以 `sourcePort` 找到該列，查看 `metadata.remoteDestination`。有使用代理節點時，這個欄位反映的是代理的對外連線。 [Apple 封包擷取指南](https://developer.apple.com/documentation/network/recording-a-packet-trace) · [Mihomo 連線 API](https://wiki.metacubex.one/en/api/#connections)

### 實測流量與帳單核對

同一台 Mac 的兩次實際播放取樣如下。兩輪播放內容和取樣時間不同，數字用於確認出站版本。

| 網易雲播放取樣 | IPv4 下載 | IPv6 下載 |
| --- | ---: | ---: |
| 當時只生效一般 IPv6 優先，取樣 80 秒 | 111.0 MiB | 7.7 MiB |
| 啟用 DNS 補強及指定 CDN 僅用 IPv6，含換歌取樣 60 秒 | 0 MiB | 68.4 MiB |

第一輪的 IPv4 大流量主要來自 `m801.music.126.net`。第二輪這個主機約 29.9 MiB 的下載走了 IPv6。表格只計取樣期間觀測到的網易雲下載，後續用量頁仍有扣量疑問，尚未取得對應明細。

核對帳單時，記下測試開始和結束的時間、Mac 的 IPv4／IPv6 出站量，再比對用量頁**同一時段**的增量。確認用量頁計入哪些 IP 版本，以及是否合併其他裝置。腳本 B 的公用 DNS 查詢使用 IPv4，其他程式、未命中 CDN 清單的流量，以及只有數字 IP 而無網域的連線，仍可能產生 IPv4 用量。

## 使用上的取捨

- TCP 的 IPv4 和 IPv6 可並行嘗試。兩種都能解析、IPv4 先連上而 IPv6 還在嘗試時，Mihomo 有約 300 毫秒的偏好等待窗口。實際播放和傳輸快慢仍取決於 CDN 與網路路徑。 [Mihomo v1.19.32 連線實作](https://github.com/MetaCubeX/mihomo/blob/v1.19.32/component/dialer/dialer.go)
- 一般 IPv6 優先策略可連到只有 IPv4 位址的 CDN。指定 CDN 的 IPv6 限制以網易雲程序、TCP 和已知網域為範圍。若需要讓 Mac 透過 IPv6 存取只支援 IPv4 的目的地，可用能以 IPv6 連入、也能代連 IPv4 的代理節點。 [Mihomo 出站 IP 版本](https://wiki.metacubex.one/en/config/proxies/#ip-version)
- 要還原時，將代理組切回原本的選項，並停用加入的擴充指令碼或還原先前備份，再重新啟用訂閱。

## 腳本 A 指定服務 IPv6 優先直連

```javascript
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
```

## 腳本 B 網易雲 CDN 補強與限制

```javascript
// 接在腳本 A 結尾。訂閱名稱需和 Clash 中顯示的名稱完全相同。
const neteaseProfileName = "請填入訂閱名稱";
const neteaseIPv6Only = true;
const applyServiceIPv6Preferences = main;

main = function (config, profileName) {
  const updated = applyServiceIPv6Preferences(config, profileName);
  if (profileName !== neteaseProfileName) return updated;

  const neteaseResolvers = [
    "udp://119.29.29.29#DIRECT",
    "udp://223.5.5.5#DIRECT"
  ];
  const cdnSuffixes = [
    "music.126.net",
    "music.126.net.ctlcdn.cn",
    "music.126.net.166cdn.com",
    "music.126.net.163jiasu.com",
    "music.126.net.a.bdydns.com"
  ];
  const cdnHosts = [
    "opencdnnetmusic.jomodns.com",
    "opencdnm126musicv6.jomodns.com",
    "opencdnm126musicv6.cloud.c4hcdn.com"
  ];

  const dns = updated.dns;
  if (dns && dns.enable) {
    const policy = { ...(dns["nameserver-policy"] || {}) };
    for (const suffix of cdnSuffixes) policy["+." + suffix] = neteaseResolvers;
    for (const host of cdnHosts) policy[host] = neteaseResolvers;
    dns["nameserver-policy"] = policy;
    dns["direct-nameserver-follow-policy"] = true;
  }
  if (!neteaseIPv6Only) return updated;

  const outbound = "網易雲 CDN IPv6 直連";
  const matches = [
    ...cdnSuffixes.map(suffix => "(DOMAIN-SUFFIX," + suffix + ")"),
    ...cdnHosts.map(host => "(DOMAIN," + host + ")")
  ];
  const rule = "AND,((NETWORK,tcp),(PROCESS-NAME-WILDCARD,NeteaseMusic*),(OR,("
    + matches.join(",") + ")))," + outbound;
  const proxies = updated.proxies || [];
  if (!proxies.some(proxy => proxy.name === outbound)) {
    updated.proxies = [...proxies, { name: outbound, type: "direct", "ip-version": "ipv6" }];
  }
  const rules = updated.rules || [];
  if (!rules.includes(rule)) {
    const afterPrivate = rules.findIndex(entry => !/^(?:GEOIP|GEOSITE),private,/i.test(entry));
    const index = afterPrivate < 0 ? rules.length : afterPrivate;
    updated.rules = [...rules.slice(0, index), rule, ...rules.slice(index)];
  }
  return updated;
};
```
