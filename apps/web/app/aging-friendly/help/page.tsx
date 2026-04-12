import { BookOpenIcon } from "lucide-react";

const HELP_SECTIONS = [
  {
    q: "如何开始与 Eveheart 对话？",
    a: "点击底部导航栏中的「AI 对话」按钮，进入对话界面。您可以直接在输入框中打字发送消息，也可以点击页面上的建议话题快速开始。",
  },
  {
    q: "如何使用数字人功能？",
    a: "点击底部「数字人」按钮，进入数字人界面。点击「开始通话」后，Eveheart 会用语音与您实时交流。请确保您的麦克风已开启。",
  },
  {
    q: "如何调整字体大小？",
    a: "进入底部「设置」页面，在「显示与无障碍」区域中可以选择界面字号：标准、大、特大、超大。选择后点击「保存设置」即可生效。",
  },
  {
    q: "如何开启或关闭语音朗读？",
    a: "进入「设置」页面，在「对话体验偏好」中找到「语音功能」开关，开启后 Eveheart 可以朗读对话内容。您也可以在此调整语速。",
  },
  {
    q: "如何退出适老化模式，回到标准界面？",
    a: "进入底部「设置」页面，在「显示与无障碍」区域找到「适老化模式」开关，将其关闭后点击「保存设置」，即可自动跳回标准界面。",
  },
  {
    q: "如何设置情绪提醒？",
    a: "进入「设置」页面，在「情绪追踪提醒」区域开启提醒开关，设置您希望收到提醒的时间和频率，然后保存即可。",
  },
];

export default function AgingFriendlyHelpPage() {
  return (
    <div className="px-5 py-8 max-w-2xl mx-auto space-y-8 pb-10">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <BookOpenIcon className="size-9 text-primary shrink-0" strokeWidth={1.75} />
        <div>
          <h1 className="text-4xl font-bold leading-tight text-foreground">内容帮助</h1>
          <p className="text-xl text-muted-foreground mt-1">常见问题解答</p>
        </div>
      </div>

      {/* FAQ cards */}
      <div className="space-y-5">
        {HELP_SECTIONS.map((section, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card shadow-sm p-6 space-y-3"
          >
            <h2 className="text-2xl font-semibold text-foreground leading-snug">
              {section.q}
            </h2>
            <p className="text-xl leading-relaxed text-muted-foreground">{section.a}</p>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 text-center">
        <p className="text-xl text-primary font-medium">
          如有其他问题，请直接告诉 Eveheart，它会尽力为您解答。
        </p>
      </div>
    </div>
  );
}
