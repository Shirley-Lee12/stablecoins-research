# Code 说明 ── sourceType 最终枚举(slug 模式,中英双语)

> 收口 sourceType。与标签表一致:**存 slug(语言无关),前端按当前语言显示 nameZh / nameEn**。
> 不要把 sourceType 存成中文或英文字符串;存 slug。

## 最终 7 类(报告与智库报告已合并为 report)

| slug | nameZh | nameEn |
|---|---|---|
| journal_article | 期刊论文 | Journal Article |
| working_paper | 工作论文 / 预印本 | Working Paper / Preprint |
| conference_paper | 会议论文 | Conference Paper |
| thesis | 学位论文 | Thesis |
| report | 研究与行业报告 | Research & Industry Report |
| gov_document | 法律与监管文件 | Laws & Regulatory Documents |
| news | 新闻与评论 | News & Commentary |

## 分类边界

| 类型 | 纳入标准 | 不应归入 |
|---|---|---|
| journal_article | 已由学术或专业期刊正式发表的文章；期刊名、卷期页码、CNKI 期刊类型或出版 DOI 是主要证据 | SSRN/arXiv 预印本、机构网页文章、白皮书 |
| working_paper | 工作论文系列、预印本或尚未作为期刊文章正式发表的研究稿；SSRN/arXiv 且无正式出版证据时归入此类 | 已正式出版的期刊版本 |
| conference_paper | 会议论文集收录或明确在会议发表的论文 | 仅在研讨会介绍但没有会议论文身份的网页 |
| thesis | 大学授予学位所对应的硕士或博士论文 | 普通课程论文、工作论文 |
| report | 机构独立发布的研究、政策、行业、审计或技术成果；通常有报告/白皮书身份、封面目录、执行摘要、报告编号或方法说明。网页可以是报告落地页 | 普通新闻稿、观点文章、博客、访谈 |
| gov_document | 法律法规、监管规则、官方指引、咨询文件及其他具有权威规范性质的公共部门文件 | 政府或国际组织发布的一般研究报告；后者仍归 report |
| news | 新闻、评论、观点、博客、访谈、公告及没有独立报告身份的网页文章；Stories/News/Blog/Opinion 栏目默认归入此类 | 有独立报告身份的正式报告，即使由新闻页介绍 |

判断优先使用资源本身的出版身份，而不是仅看发布机构。例如 BIS 的正式研究报告归 `report`，监管机关发布的约束性指引归 `gov_document`，机构网站的观点文章归 `news`。

## 实现要点
- 若现有 `sourceType` 是英文字符串枚举(如 `"Working Paper"`),收口成上面的 slug;前端展示用 nameZh/nameEn 映射(可做成一张小常量表或一张 `source_types` 种子表,跟 tags 一样)
- 来源是机构、公司还是智库，**不靠 sourceType 区分**，靠作者/发布机构字段体现；同一机构可以同时发布 report、gov_document 和 news
- 题录类型映射(知网 RT/%0/{Reference Type} → slug):
  - Journal Article → journal_article
  - Conference Proceeding(s) → conference_paper
  - Dissertation/Thesis / Thesis → thesis
  - Newspaper Article → news
  - Report → report

## 受影响的夹具
- batch2 改用 slug(见 test-fixtures-batch2-urldoi-v3.json,**替换 v1/v2**)
- batch3 直接用 slug(见 test-fixtures-batch3-cnki.json)
