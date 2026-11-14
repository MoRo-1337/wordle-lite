export const WORDS = {
  zh: [
    '春暖花开', '一帆风顺', '心想事成', '万事如意', '海阔天空', '鸟语花香',
    '山清水秀', '自由自在', '千言万语', '全心全意', '五光十色', '四面八方',
    '三心二意', '百花齐放', '风和日丽', '云淡风轻', '欢天喜地', '平安无事',
    '明明白白', '津津有味', '生机勃勃', '欣欣向荣', '日新月异', '不约而同',
    '与众不同', '井井有条', '画龙点睛', '守株待兔', '刻舟求剑', '亡羊补牢',
    '掩耳盗铃', '对牛弹琴', '一见钟情', '脚踏实地', '水到渠成', '随遇而安',
    '坚持不懈', '乘风破浪', '未来可期', '如愿以偿', '得心应手', '柳暗花明',
    '峰回路转', '天长地久', '目不转睛', '大开眼界', '恍然大悟', '温故知新',
    '学以致用', '实事求是', '精益求精', '举一反三', '名列前茅', '一鸣惊人',
    '金榜题名', '相得益彰', '妙笔生花', '历历在目', '念念不忘', '万里晴空',
  ],
  en: [
    'APPLE', 'BRAVE', 'CLOUD', 'DREAM', 'EARTH', 'FLAME', 'GRACE', 'HEART',
    'IVORY', 'JOLLY', 'KNIFE', 'LIGHT', 'MAGIC', 'NIGHT', 'OCEAN', 'PEARL',
    'QUIET', 'RIVER', 'SMILE', 'TIGER', 'UNITY', 'VOICE', 'WORLD', 'YOUNG',
    'ZEBRA', 'AUDIO', 'BEACH', 'CHAIR', 'DANCE', 'EAGER', 'FRESH', 'GREEN',
    'HOUSE', 'IDEAL', 'JUICE', 'LEMON', 'MONEY', 'NORTH', 'OLIVE', 'PIANO',
    'QUEEN', 'ROUND', 'STONE', 'TABLE', 'UNDER', 'WATER', 'WOMAN', 'BREAD',
    'CROWN', 'DRINK', 'FIELD', 'GIANT', 'HAPPY', 'LEARN', 'MUSIC', 'PLANT',
    'SWEET', 'TRAIN', 'WATCH', 'WRITE', 'AMBER', 'BLOOM', 'CHARM', 'FOCUS',
  ],
};

export const LANGUAGE_CONFIG = {
  zh: {
    label: '中文',
    shortLabel: '中',
    locale: 'zh-CN',
    length: 4,
    attempts: 10,
    fontClass: 'font-cjk',
    inputMode: 'text',
    pattern: /^[\u3400-\u9fff]{4}$/u,
  },
  en: {
    label: 'English',
    shortLabel: 'EN',
    locale: 'en',
    length: 5,
    attempts: 6,
    fontClass: 'font-latin',
    inputMode: 'text',
    pattern: /^[A-Z]{5}$/,
  },
};
