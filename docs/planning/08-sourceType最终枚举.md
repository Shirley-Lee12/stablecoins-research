# Code 说明 ── sourceType 最终枚举(slug 模式,中英双语)

> 收口 sourceType。与标签表一致:**存 slug(语言无关),前端按当前语言显示 nameZh / nameEn**。
> 不要把 sourceType 存成中文或英文字符串;存 slug。

## 最终 7 类(报告与智库报告已合并为 report)

| slug | nameZh | nameEn |
|---|---|---|
| journal_article | 期刊论文 | Journal Article |
| working_paper | 工作论文 | Working Paper |
| conference_paper | 会议论文 | Conference Paper |
| thesis | 学位论文 | Thesis |
| report | 报告 | Report |
| gov_document | 政府文件 | Government Document |
| news | 新闻 | News |

## 实现要点
- 若现有 `sourceType` 是英文字符串枚举(如 `"Working Paper"`),收口成上面的 slug;前端展示用 nameZh/nameEn 映射(可做成一张小常量表或一张 `source_types` 种子表,跟 tags 一样)
- 来源是机构/公司还是智库,**不靠 sourceType 区分**,靠 authorRaw 里的机构名体现(Coinbase、Worldpay、BIS 都归 report)
- 题录类型映射(知网 RT/%0/{Reference Type} → slug):
  - Journal Article → journal_article
  - Conference Proceeding(s) → conference_paper
  - Dissertation/Thesis / Thesis → thesis
  - Newspaper Article → news
  - Report → report

## 受影响的夹具
- batch2 改用 slug(见 test-fixtures-batch2-urldoi-v3.json,**替换 v1/v2**)
- batch3 直接用 slug(见 test-fixtures-batch3-cnki.json)
