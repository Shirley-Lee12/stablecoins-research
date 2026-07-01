# 上传管线测试 ── 10 篇真实文献

> 配合 `test-fixtures-10papers.json` 使用。目的:用 10 篇真实稳定币/金融文献端到端验证 U.2(反查链接)、U.4(核对)、`retagResources()`(打标)。
> 链接已由人工预先查实,作为"标准答案"写进夹具的 `expected`。

## 这 10 篇按测试路径分两组

**A 组(6 篇,有 DOI)→ 走 resolveDoi 路径**:#1 #2 #3 #4 #9 #10
验证:DOI 能解析、解析出的标题与卡片标题一致、sourceType 判定正确、打标正确。

**B 组(4 篇,无链接)→ 走 U.2 标题反查路径**:#5 #6 #7 #8
验证:仅凭标题+作者能否查到规范链接、年份能否回填、交叉验证(作者/年份)能否通过。

## 必须能通过的关键断言

1. **A 组 DOI 全部解析成功**,且解析标题与输入标题一致(#4 标题极短"CoVaR",注意别误判)。
2. **B 组 #5 #6 #7 反查命中**,canonicalUrl/doi 与夹具一致,年份从 null 回填正确。
3. **#8 是最重要的边界**,四个点缺一不可:
   - 反查前清洗标题(去掉 PDF 图注污染 `Image: Getty images/iStockphoto`),否则搜不准
   - Crossref/OpenAlex 查不到时**不能直接 not_found**,要回退普通网页检索拿到 WEF 链接
   - 无 DOI → `access_status=open_access`、`doi=null`,**不因缺 DOI 拒收**(走 needs_review 或正常入库)
   - sourceType 判为 News/观点,不是 Journal Paper
4. **非稳定币文献不被强塞标签**:#1 #4 #9 是经典金融论文,应只命中 `systemic-contagion`,不应出现 fiat-collateralized 之类稳定币标签。若出现 → 相似度阈值偏低,需调高。
5. **打标走重合判定,不要求精确相等**:命中标签覆盖 expected 的 primary 即算过,允许 ±1 偏差(打标是相似度匹配,本就不该追求逐字命中)。
6. **资产实体匹配**:#5 命中 usdt/usdc,#6 命中 ust。注意 #6 的 UST 必须靠单词边界匹配,别把别处的 "trust/just" 误判成 UST(币种)。
7. **作者去重**:#5 #6 共享 Ahmed/Aldasoro,#3 #4 共享 Adrian。入库后 authors 表里这些人应各只有一条,resource_authors 多对多关联,不应建出重复作者。

## 完整性分档(对接 U.5 状态机)

- #1–#4、#9、#10:六要素齐(有 DOI)→ 核对全过 → `pending`(普通)/`approved`(管理员)
- #5 #6 #7:反查补全后六要素齐 → 同上
- #8:无 DOI 但有 canonicalUrl + 摘要 → **入库标 `needs_review`**(带核对报告),不拒收

## 怎么落地成测试

两种用法,按 Code 当前进度选:
- **自动化**:把 `fixtures[].input` 喂给管线,断言输出对上 `expected`(链接/DOI/sourceType 精确比对;标签用集合重合度 ≥ primary)。B 组依赖联网,可标记为 integration test。
- **手动验证**:U.6 前端做好后,把这 10 条按 DOI/标题逐个走一遍上传,对照本表人工核对。这也是 `retagResources()` 第一次拿到真实数据——正好同时验证打标。

## 备注

- 夹具里的链接是 2026-06 人工查实的,BIS/ECB working paper 编号稳定,SSRN DOI 稳定,可长期作为基准。
- #7 同一论文存在 ECB WP / CEPR DP / IJCB 期刊三个版本,反查只需稳定返回其一(优先规范度高的:期刊版或 ECB 官方),不要因为多版本就报冲突或 not_found。
