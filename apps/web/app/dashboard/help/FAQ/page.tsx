import FAQ from '@/components/shadcn-studio/blocks/faq-component-01/faq-component-01'

const faqItems = [
  {
    question: '这个心理助手可以提供专业医疗诊断吗？',
    answer:
      '不可以。本系统仅提供情绪陪伴、心理疏导、压力缓解、科普知识等非医疗服务，不能替代专业心理医生或医疗机构的诊断与治疗。如有严重心理困扰，建议及时寻求专业心理咨询师帮助。'
  },
  {
    question: '对话内容会被保存或泄露吗？',
    answer:
      '不会。所有对话仅用于实时交互，严格保护用户隐私，不会上传、存储或泄露任何个人信息。本地对话记录仅保存在用户设备，可随时清除。'
  },
  {
    question: '知识库内容来自哪里，是否专业可靠？',
    answer:
      '系统知识库来源于权威心理科普资料、高校心理健康教育内容、官方情绪调节指南，所有内容经过整理与验证，确保科学、安全、适合日常情绪疏导使用。'
  },
  {
    question: '使用时需要联网吗？',
    answer:
      '基础语音交互与部分本地功能可离线运行；实时语音对话、知识库检索、AI回复等功能需要保持网络连接以保证最佳效果。'
  },
  {
    question: '适合哪些人群使用？',
    answer:
      '适合需要情绪舒缓、压力调节、焦虑缓解、心理陪伴的人群使用，尤其适合学生、上班族、长期精神紧张或需要倾诉支持的用户。'
  }
];

const FAQPage = () => {
  return <FAQ faqItems={faqItems} />
}

export default FAQPage
