// Research statements and original figures are sourced from the supplied CV's 工作展示 / 项目经历.
const fig = (n, caption) => ({ src: `assets/research/figure-${String(n).padStart(2,'0')}.webp`, caption });
export const topics = [
 {id:'teos',anchor:'inlet',title:'TEOS · 看见液化风险',short:'温压变化 → 风险位置',field:'thermal',summary:'沿着输运管路的温度与压力变化，识别潜在液化位置，辅助结构设计与选型。',detail:'通过 CFD 分析不同管路结构的温压分布，结合 TEOS 气化特性与设计路线的温压曲线，比较失温、压降等因素对应的相对液化风险。',media:[fig(6,'管路结构、温压分布与液化风险分析')],kind:'研究原图'},
 {id:'pvd',anchor:'inlet',title:'长管 PVD · 延伸输运距离',short:'沿程衰减 → 沉积均匀性',field:'chemistry',summary:'研究大长径比管道中的粒子输运与沿程衰减，关联压力分布、有效输运距离和内壁镀膜均匀性。',detail:'负责长管流场及粒子输运模型建立与分析，比较压力、流量和结构条件的影响，形成工艺与结构调控依据。这里的粒子及沉积变化用于解释研究问题，不是项目计算数据。',animation:'pipe',kind:'示意动画'},
 {id:'gap',anchor:'plate',title:'双层孔板 · 气体如何再分布',short:'孔隙与间隙 → 输运分布',field:'structure',summary:'从微通道射流、板间压力和流导变化，理解双层喷淋板对气体分布均匀性的影响。',detail:'围绕 showerhead–blocker 结构开展 CFD 分析，比较孔径分布、孔间距和板间距，形成面向气体均匀器设计的结构优化依据。',media:[fig(7,'双层孔板输运与分布示意'),fig(8,'结构条件下的速度分布对比'),fig(10,'板间距与输运响应'),fig(9,'不同条件下的响应对比')],kind:'研究原图'},
 {id:'jets',anchor:'plate',title:'微通道 · 孔型改变射流',short:'等径、收缩、扩张 → 射流响应',field:'structure',summary:'比较不同孔型与流态下的微通道射流，建立结构参数与射流均匀性之间的联系。',detail:'建立一致几何与边界条件下的结构对比方案，开展滑移与过渡流计算，提取多孔阵列的响应特征并评估射流均匀性。',paper:'刘万锁、岳向吉、蔺增：《PECVD 喷淋板上微通道结构对射流均匀性的影响性分析》，中国表面工程，2023，36(5)：222–233。',media:[fig(15,'微通道出口射流及速度对比'),fig(14,'孔阵上方的速度分布'),fig(13,'射流均匀性评估示意'),fig(16,'孔型组合响应')],kind:'研究原图'},
 {id:'hybrid',anchor:'plate',title:'NS–DSMC · 跨越流态边界',short:'连续域 ↔ 粒子域',field:'structure',summary:'将连续流与粒子方法连接起来，处理 PECVD 微尺度区域中的跨流态输运。',detail:'构建双向耦合框架、界面信息交互和区域划分方案，并设计非稳态“超前演算”时间推进机制，协调不同求解区域的时间步。',paper:'刘万锁、岳向吉、蔺增：《应用于 PECVD 过渡流模拟的 NS/DSMC 双向耦合方法特性研究》，东北大学学报（自然科学版），2023，44(11)：1591–1595。',media:[fig(11,'连续与粒子方法的速度响应对比'),fig(12,'耦合研究中的分布结果')],kind:'研究原图'},
 {id:'aging',anchor:'plate',title:'孔道老化 · 从结构到通量',short:'孔道演化 → 速度与通量偏移',field:'structure',summary:'把孔道扩张与腐蚀演化转化为代表性结构，观察出口速度和通量分布如何随老化改变。',detail:'基于氟等离子刻蚀下的微通道变化，建立老化阶段、结构映射和流动计算流程，形成用于鲁棒性评估与结构筛选的响应特征库。',paper:'Liu W, Yue X, Lin Z. Study on characteristics of microchannel jet for showerhead in different fluid regimes based on hybrid NS-DSMC methodology. Microfluidics and Nanofluidics, 2024, 28:12.',media:[fig(26,'孔道结构演化与腔室关联'),fig(28,'老化结构下的射流响应'),fig(27,'板上下游压力分布'),fig(29,'初始与老化状态响应对比')],kind:'研究原图'},
 {id:'plasma',anchor:'plasma',title:'等离子体 · 场与流的交汇',short:'电场、流场与结构的共同作用',field:'plasma',summary:'结合漂移–扩散方程与气体流场求解，研究结构和电场条件下的等离子体空间分布。',detail:'围绕电极间距、电场梯度及密度分布组织参数输入，建立多场联合解算流程和结果数据接口。下方采用简历中的原始结果图。',media:[fig(22,'微结构附近的电子温度分布'),fig(23,'结构变化与电子密度'),fig(24,'相关分布及实验响应'),fig(25,'孔板结构与空间分布关联')],kind:'研究原图'},
 {id:'prediction',anchor:'wafer',title:'AI · 从孔阵预测膜厚',short:'孔阵 → 流场特征 → 膜厚分布',field:'chemistry',summary:'结合高斯扩散核与迎风方向核，以流场特征构建孔隙分布到膜厚的快速近似映射。',detail:'开发数据预处理、核函数生成、局部速度拟合和结果可视化流程，支持非均匀孔阵及结构扰动输入；利用预测误差数据评估模型的适用边界。',paper:'相关论文：Operator-Based Predictive Modeling of Deposition Patterns in Evolving Microchannel Systems。简历记录状态：在投。',media:[fig(2,'结构、沉积与预测的关联框架'),fig(4,'双核算子与晶圆分布预测'),fig(3,'流动特征与沉积分布的联系'),fig(5,'不同结构条件下的预测对比')],kind:'研究原图'},
 {id:'experiment',anchor:'wafer',title:'实验 · 验证结构与膜厚的联系',short:'孔阵扰动 → 测量与映射',field:'chemistry',summary:'将孔阵结构、速度分布与膜厚测量对应起来，让结构响应与预测模型有实验依据。',detail:'完成结构参数设计、样件加工及 PECVD 平台实验，形成基于椭偏仪与 XRF 的测量方法、多点采样方案及结构到速度／通量特征的映射流程。',media:[fig(20,'结构响应的晶圆分布展示'),fig(19,'不同条件下的空间分布'),fig(21,'分布变化对比'),fig(17,'模型结构与局部孔道'),fig(18,'结构扰动与均匀性响应')],kind:'研究原图'},
 {id:'pump',anchor:'outlet',title:'分子泵 · 多腔室协同抽气',short:'多流口 → 压力传递与串扰',field:null,summary:'研究入口位置、级组结构和气体负荷对多腔室抽气的影响，关注压力响应、逆流与腔室串扰。',detail:'面向质谱仪多腔室并联抽气，设计整泵跨流态计算方案与流口—级组协同优化路线。示意动画仅帮助理解不同入口接入级组的关系，不代表泵的具体几何、抽速或性能结果。',animation:'pump',kind:'示意动画'}
];
export const anchors = [
 {id:'inlet',label:'输运管路',point:[.3,2.7,0],side:'left',fields:['thermal']},
 {id:'plate',label:'孔板与微通道',point:[-1.4,1.2,0],side:'left',fields:['structure']},
 {id:'plasma',label:'等离子体耦合',point:[1.25,.25,0],side:'right',fields:['plasma'],conditional:true},
 {id:'wafer',label:'晶圆 · AI 预测',point:[1.1,-1.03,0],side:'right',fields:['chemistry']},
 {id:'outlet',label:'分子泵与真空',point:[.25,-2.95,0],side:'left',fields:[]}
];
