function main(config, profileName) {
  const dns = config.dns;
  if (!dns || !dns.enable) {
    return config;
  }

  // 範例解析器。請依自己的網路和 CDN 的 AAAA 查詢結果調整。
  const neteaseResolvers = [
    "udp://119.29.29.29#DIRECT",
    "udp://223.5.5.5#DIRECT"
  ];
  const neteaseDomains = [
    "+.music.126.net",
    "+.music.126.net.ctlcdn.cn",
    "+.music.126.net.166cdn.com",
    "+.music.126.net.163jiasu.com",
    "+.music.126.net.a.bdydns.com"
  ];

  const nameserverPolicy = { ...(dns["nameserver-policy"] || {}) };
  for (const domain of neteaseDomains) {
    nameserverPolicy[domain] = neteaseResolvers;
  }
  dns["nameserver-policy"] = nameserverPolicy;
  dns["direct-nameserver-follow-policy"] = true;
  return config;
}