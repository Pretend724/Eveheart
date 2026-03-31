export default function Page() {
  return (
    <main className="p-5 pb-32">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <h3 className="font-headline text-3xl font-extrabold tracking-tight text-on-background mb-2">
            Tailor your Sanctuary
          </h3>
          <p className="text-on-surface-variant max-w-2xl">
            Adjust how Eveheart interacts with you. Your preferences are private
            and used only to create a more supportive environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: AI Companion Preference Card */}
          <section className="bg-[#1E1E2D] rounded-xl p-8 shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="auto_awesome"
              >
                auto_awesome
              </span>
              <h4 className="font-headline text-lg font-bold text-on-surface">
                AI Companion Preference
              </h4>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                  AI Tone
                </label>
                <select className="w-full bg-surface-container-lowest border-none rounded-lg py-3 px-4 text-on-surface focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer">
                  <option>Gentle Healing</option>
                  <option>Professional Support</option>
                  <option>Lively Companion</option>
                  <option>Calm Listening</option>
                </select>
              </div>
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Conversation Depth
                  </label>
                  <span className="text-xs text-primary font-medium">
                    Deep Reflection
                  </span>
                </div>
                <input
                  className="custom-slider"
                  max="100"
                  min="0"
                  type="range"
                  value="75"
                />
              </div>
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Emotional Intensity
                  </label>
                  <span className="text-xs text-primary font-medium">
                    Empathetic
                  </span>
                </div>
                <input
                  className="custom-slider"
                  max="100"
                  min="0"
                  type="range"
                  value="60"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                  Custom Greeting
                </label>
                <input
                  className="w-full bg-surface-container-lowest border-none rounded-lg py-3 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/30"
                  placeholder="e.g., Welcome home, Alex"
                  type="text"
                />
              </div>
            </div>
          </section>

          {/* Section 2: Interface & Theme Card */}
          <section className="bg-[#1E1E2D] rounded-xl p-8 shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="palette"
              >
                palette
              </span>
              <h4 className="font-headline text-lg font-bold text-on-surface">
                Interface & Theme
              </h4>
            </div>
            <div className="space-y-8">
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
                  Appearance
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button className="py-2.5 px-2 bg-surface-container-lowest border border-primary/40 text-primary rounded-lg text-sm font-medium flex items-center justify-center gap-2">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      data-icon="dark_mode"
                    >
                      dark_mode
                    </span>{" "}
                    Dark
                  </button>
                  <button className="py-2.5 px-2 bg-surface-container-lowest/50 border border-outline-variant/10 text-on-surface-variant rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-container-lowest transition-colors">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      data-icon="light_mode"
                    >
                      light_mode
                    </span>{" "}
                    Light
                  </button>
                  <button className="py-2.5 px-2 bg-surface-container-lowest/50 border border-outline-variant/10 text-on-surface-variant rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-surface-container-lowest transition-colors">
                    <span
                      className="material-symbols-outlined text-[18px]"
                      data-icon="settings_brightness"
                    >
                      settings_brightness
                    </span>{" "}
                    System
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Sidebar Collapse
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Hide labels for a focused view
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div>
                <div className="flex justify-between mb-3">
                  <label className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                    Font Size
                  </label>
                  <span className="text-xs text-primary font-medium">
                    Medium
                  </span>
                </div>
                <input
                  className="custom-slider"
                  max="100"
                  min="0"
                  type="range"
                  value="40"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-4">
                  Message Bubble Style
                </label>
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary-container rounded-lg border-2 border-primary cursor-pointer flex items-center justify-center shadow-lg shadow-primary/20">
                    <span
                      className="material-symbols-outlined text-on-primary-container"
                      data-icon="chat_bubble"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      chat_bubble
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-surface-container-lowest rounded-lg border border-outline-variant/10 cursor-pointer flex items-center justify-center hover:bg-surface-container transition-colors">
                    <span
                      className="material-symbols-outlined text-outline"
                      data-icon="chat_bubble_outline"
                    >
                      chat_bubble_outline
                    </span>
                  </div>
                  <div className="w-12 h-12 bg-surface-container-lowest rounded-lg border border-outline-variant/10 cursor-pointer flex items-center justify-center hover:bg-surface-container transition-colors">
                    <span
                      className="material-symbols-outlined text-outline"
                      data-icon="forum"
                    >
                      forum
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: Notification & Prompt Card */}
          <section className="bg-[#1E1E2D] rounded-xl p-8 shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="notifications_active"
              >
                notifications_active
              </span>
              <h4 className="font-headline text-lg font-bold text-on-surface">
                Notification & Prompt
              </h4>
            </div>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-surface-container-lowest/30 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Master Notifications
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Global toggle for all alerts
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Shortcut Suggestions
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Predictive interaction buttons
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Emotional Reminders
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Gentle nudges to check in
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Sound Effects
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Ambient soft-audio feedback
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* Section 4: Privacy & Analysis Card */}
          <section className="bg-[#1E1E2D] rounded-xl p-8 shadow-sm border border-outline-variant/5">
            <div className="flex items-center gap-3 mb-8">
              <span
                className="material-symbols-outlined text-primary"
                data-icon="lock"
              >
                lock
              </span>
              <h4 className="font-headline text-lg font-bold text-on-surface">
                Privacy & Analysis
              </h4>
            </div>
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Emotional Insight Analysis
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Allow AI to track patterns over time
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-on-surface">
                    Anonymous Contribution
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Help improve Eveheart with hidden data
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input className="sr-only toggle-checkbox" type="checkbox" />
                  <div className="toggle-label w-11 h-6 bg-surface-container-lowest rounded-full transition-colors duration-300">
                    <div className="toggle-dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-300"></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-3">
                  Auto-Archive Conversations
                </label>
                <select className="w-full bg-surface-container-lowest border-none rounded-lg py-3 px-4 text-on-surface focus:ring-1 focus:ring-primary/30 appearance-none cursor-pointer">
                  <option>After 30 days</option>
                  <option>After 90 days</option>
                  <option>After 6 months</option>
                  <option>Never archive</option>
                </select>
              </div>
              <div className="p-4 bg-tertiary/5 rounded-lg border border-tertiary/10">
                <div className="flex gap-3">
                  <span
                    className="material-symbols-outlined text-tertiary text-sm"
                    data-icon="info"
                  >
                    info
                  </span>
                  <p className="text-xs text-on-surface-variant italic">
                    All your data is encrypted locally before being processed by
                    the secure companion engine.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
