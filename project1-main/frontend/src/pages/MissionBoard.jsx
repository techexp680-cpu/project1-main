import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "oc_mission_board_progress";

const missions = [
  {
    id: "discipline-reset",
    number: "01",
    title: "Discipline Reset",
    category: "Mindset",
    description:
      "Build a base level of discipline through simple, repeatable daily actions.",
    tasks: [
      "Wake up at the planned time.",
      "Make your bed before checking your phone.",
      "Write today’s top 3 priorities.",
      "Complete one difficult task without delay.",
      "Avoid one unnecessary distraction for the day.",
      "Write one line in your Discipline Journal.",
    ],
  },
  {
    id: "train-the-mind",
    number: "02",
    title: "Train the Mind",
    category: "Focus",
    description:
      "Sharpen attention, patience, and decision-making through controlled information and reflection.",
    tasks: [
      "Read one Operator Journal entry.",
      "Write down one lesson from the entry.",
      "Spend 10 minutes without social media.",
      "Practice 5 minutes of silent breathing.",
      "Identify one weakness to improve this week.",
      "End the day with a short self-review.",
    ],
  },
  {
    id: "physical-readiness",
    number: "03",
    title: "Physical Readiness",
    category: "Fitness",
    description:
      "Complete a simple physical readiness routine that builds consistency before intensity.",
    tasks: [
      "Complete 20 push-ups or your best controlled set.",
      "Complete 30 bodyweight squats.",
      "Hold a plank for 60 seconds or your best time.",
      "Walk or run for at least 10 minutes.",
      "Drink enough water through the day.",
      "Log your effort honestly.",
    ],
  },
  {
    id: "wear-the-code",
    number: "04",
    title: "Wear the Code",
    category: "Identity",
    description:
      "Understand the meaning behind what you wear. Apparel should carry identity, not noise.",
    tasks: [
      "Choose one product and read its story.",
      "Understand the meaning behind the design.",
      "Check size, fit, and material details.",
      "Add one meaningful product to wishlist.",
      "Share one Operator quote or journal note.",
      "Explore best sellers with intent.",
    ],
  },
  {
    id: "seven-day-protocol",
    number: "05",
    title: "7-Day Protocol",
    category: "Execution",
    description:
      "Use the downloadable Discipline Journal to complete a structured 7-day discipline cycle.",
    tasks: [
      "Download the Discipline Journal PDF.",
      "Print it or save it on your device.",
      "Fill your first mission plan.",
      "Track habits for one full day.",
      "Repeat for 7 days.",
      "Complete the weekly debrief.",
    ],
  },
];

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export default function MissionBoard() {
  const [openMission, setOpenMission] = useState(missions[0].id);
  const [progress, setProgress] = useState(loadProgress);

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const totalStats = useMemo(() => {
    const totalTasks = missions.reduce(
      (sum, mission) => sum + mission.tasks.length,
      0
    );

    const completedTasks = missions.reduce((sum, mission) => {
      const checkedTasks = progress[mission.id] || {};
      return (
        sum +
        mission.tasks.filter((_, index) => checkedTasks[index] === true).length
      );
    }, 0);

    const percent =
      totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return {
      totalTasks,
      completedTasks,
      percent,
    };
  }, [progress]);

  const toggleTask = (missionId, taskIndex) => {
    setProgress((current) => ({
      ...current,
      [missionId]: {
        ...(current[missionId] || {}),
        [taskIndex]: !(current[missionId] || {})[taskIndex],
      },
    }));
  };

  const resetProgress = () => {
    const ok = window.confirm("Reset all Mission Board progress?");

    if (!ok) return;

    setProgress({});
    localStorage.removeItem(STORAGE_KEY);
  };

  const getMissionProgress = (mission) => {
    const checkedTasks = progress[mission.id] || {};
    const completed = mission.tasks.filter(
      (_, index) => checkedTasks[index] === true
    ).length;

    const percent = Math.round((completed / mission.tasks.length) * 100);

    return {
      completed,
      total: mission.tasks.length,
      percent,
    };
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <section className="relative border-b border-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-ink-900 via-black to-black" />

        <div className="container-oc relative z-10 py-16 md:py-24">
          <p className="label-tiny text-gold mb-4">// OPERATOR PROTOCOL</p>

          <h1 className="display text-5xl md:text-7xl leading-none">
            MISSION BOARD
          </h1>

          <p className="text-neutral-400 max-w-2xl mt-5 text-base md:text-lg leading-8">
            A structured execution board for discipline, focus, physical
            readiness, and identity. Complete each mission step by step.
          </p>

          <div className="mt-8 grid md:grid-cols-3 gap-3 max-w-3xl">
            <div className="border border-white/10 bg-white/[0.035] p-4">
              <div className="label-tiny text-neutral-500">Completed</div>
              <div className="mono text-3xl mt-2 text-gold">
                {totalStats.completedTasks}/{totalStats.totalTasks}
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.035] p-4">
              <div className="label-tiny text-neutral-500">Progress</div>
              <div className="mono text-3xl mt-2 text-gold">
                {totalStats.percent}%
              </div>
            </div>

            <div className="border border-white/10 bg-white/[0.035] p-4">
              <div className="label-tiny text-neutral-500">Protocol</div>
              <div className="mono text-3xl mt-2 text-gold">5</div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a
              href="/downloads/operator-discipline-journal.pdf"
              download
              className="btn-primary justify-center"
            >
              DOWNLOAD DISCIPLINE JOURNAL
            </a>

            <Link to="/operator-journal" className="btn-outline justify-center">
              READ OPERATOR JOURNAL
            </Link>

            <button
              type="button"
              onClick={resetProgress}
              className="btn-outline justify-center"
            >
              RESET PROGRESS
            </button>
          </div>
        </div>
      </section>

      <section className="container-oc py-14">
        <div className="mb-6">
          <p className="label-tiny text-gold mb-2">// ACTIVE MISSIONS</p>
          <h2 className="display text-4xl">Complete The Protocol</h2>
        </div>

        <div className="space-y-4">
          {missions.map((mission) => {
            const isOpen = openMission === mission.id;
            const missionProgress = getMissionProgress(mission);

            return (
              <article
                key={mission.id}
                className="border border-white/10 bg-white/[0.035] overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenMission(isOpen ? "" : mission.id)
                  }
                  className="w-full text-left p-5 md:p-6 hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="label-tiny text-gold">
                        Mission {mission.number} · {mission.category}
                      </p>

                      <h3 className="display text-3xl mt-2">
                        {mission.title}
                      </h3>

                      <p className="text-neutral-400 mt-3 max-w-2xl leading-7">
                        {mission.description}
                      </p>
                    </div>

                    <div className="md:text-right">
                      <div className="mono text-gold text-xl">
                        {missionProgress.completed}/{missionProgress.total}
                      </div>

                      <div className="label-tiny text-neutral-500 mt-1">
                        {missionProgress.percent}% Complete
                      </div>

                      <div className="text-gold mt-3 text-sm tracking-[0.2em] uppercase">
                        {isOpen ? "Close ↑" : "Open ↓"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 h-1 bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gold transition-all duration-300"
                      style={{ width: `${missionProgress.percent}%` }}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 p-5 md:p-6">
                    <div className="space-y-3">
                      {mission.tasks.map((task, index) => {
                        const checked =
                          progress[mission.id]?.[index] === true;

                        return (
                          <label
                            key={task}
                            className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${
                              checked
                                ? "border-gold/50 bg-gold/10"
                                : "border-white/10 bg-black/20 hover:border-gold/40"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleTask(mission.id, index)}
                              className="mt-1 accent-gold"
                            />

                            <div>
                              <div
                                className={`text-sm md:text-base ${
                                  checked
                                    ? "text-white line-through decoration-gold"
                                    : "text-neutral-300"
                                }`}
                              >
                                {task}
                              </div>

                              <div className="label-tiny text-neutral-600 mt-1">
                                Task {String(index + 1).padStart(2, "0")}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-oc pb-16">
        <div className="border border-gold/30 bg-gold/10 p-6 md:p-8">
          <p className="label-tiny text-gold mb-3">// DAILY EXECUTION</p>

          <h2 className="display text-4xl">7-Day Discipline Journal</h2>

          <p className="text-neutral-300 max-w-2xl mt-4 leading-7">
            Use the printable Discipline Journal with this Mission Board.
            Plan the day, execute the tasks, track the habits, and debrief at
            the end of the week.
          </p>

          <a
            href="/downloads/operator-discipline-journal.pdf"
            download
            className="btn-primary mt-6 inline-flex justify-center"
          >
            DOWNLOAD JOURNAL
          </a>
        </div>
      </section>
    </div>
  );
}
