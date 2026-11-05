import type { AppLocale } from "@/i18n/routing";

export type ToolSlug =
  | "flashcards"
  | "learn"
  | "srs"
  | "progress"
  | "test"
  | "groups"
  | "live";

export const TOOL_SLUGS: ToolSlug[] = [
  "flashcards",
  "learn",
  "srs",
  "progress",
  "test",
  "groups",
  "live",
];

export const TOOL_APP_HREF: Record<ToolSlug, string | null> = {
  flashcards: "/",
  learn: "/",
  srs: "/progress",
  progress: "/progress",
  test: null,
  groups: null,
  live: null,
};

export function isToolAvailable(slug: ToolSlug): boolean {
  return TOOL_APP_HREF[slug] !== null;
}

interface ToolCopy {
  badge: string;
  heroTitle: string;
  heroSubtitle: string;
  primaryCta: string;
  secondaryCta: string;
  featuresEyebrow: string;
  featuresTitle: string;
  featuresSubtitle: string;
  features: Array<{ title: string; desc: string }>;
  howEyebrow: string;
  howTitle: string;
  howSubtitle: string;
  steps: Array<{ title: string; desc: string }>;
  previewNote: string;
}

/**
 * Copy song ngữ cho landing từng công cụ.
 * Đặt trong TS (thay vì messages/*.json) để PR gọn: 7 tools × ~15 chuỗi × 5 locale
 * trong JSON sẽ phình ~500 keys. ja/ko/zh fallback sang en, vi/en đầy đủ.
 * Khi nào cần SEO đa ngữ đầy đủ thì chuyển sang messages namespace `landing.tools`.
 */
const VI: Record<ToolSlug, ToolCopy> = {
  flashcards: {
    badge: "Thẻ ghi nhớ · Lật 3D",
    heroTitle: "Ghi nhớ nhanh với Flashcard 3D",
    heroSubtitle:
      "Lật thẻ, xáo trộn, tự phát và toàn màn hình — mọi tính năng đã có sẵn trong app, miễn phí cho người học.",
    primaryCta: "Mở flashcard ngay",
    secondaryCta: "Tạo học phần",
    featuresEyebrow: "Tính năng",
    featuresTitle: "Một học phần, học thuộc mọi hướng",
    featuresSubtitle: "Chế độ flashcard 3D xây trên design token của app — nhanh, mượt, không giật.",
    features: [
      { title: "Lật 3D mượt", desc: "Hiệu ứng lật perspective, hỗ trợ phím Space, nút lật và vuốt." },
      { title: "Xáo trộn (Shuffle)", desc: "Đảo thứ tự thẻ mỗi vòng để tránh học vẹt theo vị trí." },
      { title: "Tự phát + Toàn màn hình", desc: "Autoplay chạy từng thẻ, fullscreen để học tập trung." },
      { title: "Gợi ý + Phát âm", desc: "Mỗi thẻ có hint, nghe phát âm thuật ngữ và gắn sao để ôn riêng." },
    ],
    howEyebrow: "Cách dùng",
    howTitle: "Tạo thẻ, lật thẻ, thuộc bài",
    howSubtitle: "Ba bước duy nhất — không cần thiết lập gì thêm.",
    steps: [
      { title: "Tạo học phần", desc: "Thêm thuật ngữ thủ công hoặc nhập 1000 dòng từ văn bản trong vài giây." },
      { title: "Lật và tự kiểm tra", desc: "Xem thuật ngữ, đoán định nghĩa rồi lật để đối chiếu. Gắn sao thẻ khó." },
      { title: "Xáo trộn và lặp lại", desc: "Bật shuffle, chạy autoplay và quay lại mỗi ngày để giữ streak." },
    ],
    previewNote: "Xem trước giao diện flashcard thật trong app.",
  },
  learn: {
    badge: "Học thích ứng · Trắc nghiệm + Tự luận",
    heroTitle: "Học đúng chỗ hổng với Learn",
    heroSubtitle:
      "Engine thích ứng trộn trắc nghiệm, đúng/sai, tự luận và tự đánh giá — chấm tức thì, xếp lịch ôn theo mức nhớ.",
    primaryCta: "Bắt đầu học ngay",
    secondaryCta: "Tạo học phần",
    featuresEyebrow: "Tính năng",
    featuresTitle: "Bốn dạng câu hỏi, một engine",
    featuresSubtitle: "Mỗi câu trả lời đều cập nhật điểm nắm vững và lịch SRS của thẻ.",
    features: [
      { title: "Trắc nghiệm (MCQ)", desc: "Chọn định nghĩa đúng trong 4 đáp án, có đáp án nhiễu thông minh." },
      { title: "Đúng / Sai", desc: "Đối chiếu mệnh đề nhanh để kiểm tra phản xạ ghi nhớ." },
      { title: "Tự luận (Written)", desc: "Gõ định nghĩa để ép recall chủ động thay vì nhận diện." },
      { title: "Chấm + xếp lịch SRS", desc: "Đúng/sai hiện giải thích ngay, đánh giá Mức nhớ để hẹn ngày ôn." },
    ],
    howEyebrow: "Cách dùng",
    howTitle: "Mở phiên Learn, trả lời, lên trình",
    howSubtitle: "Phiên học tự thích ứng theo trình độ của bạn.",
    steps: [
      { title: "Mở học phần", desc: "Từ trang chi tiết học phần, bấm Học với chế độ Learn." },
      { title: "Trả lời liên tục", desc: "Đi qua MCQ, đúng/sai, tự luận — xem feedback ngay sau mỗi câu." },
      { title: "Đánh giá mức nhớ", desc: "Chọn Lại / Khó / Tạm được / Dễ để SRS hẹn ngày ôn tối ưu." },
    ],
    previewNote: "Phiên Learn mẫu: câu hỏi, feedback và thanh SRS.",
  },
  srs: {
    badge: "Lặp lại ngắt quãng · Engine 5 lớp",
    heroTitle: "Đúng ngày ôn, nhớ lâu hơn",
    heroSubtitle:
      "Banner đến hạn nhắc mỗi ngày, engine SRS 5 lớp tự lên lịch theo mức nhớ — giữ streak mà không cần ghi chép.",
    primaryCta: "Xem thẻ đến hạn",
    secondaryCta: "Tạo học phần",
    featuresEyebrow: "Tính năng",
    featuresTitle: "Ôn ít hơn, nhớ lâu hơn",
    featuresSubtitle: "Thuật toán lên lịch dựa trên lần trả lời gần nhất của từng thẻ.",
    features: [
      { title: "Banner đến hạn", desc: "Mở dashboard là thấy ngay hôm nay có bao nhiêu thẻ cần ôn." },
      { title: "Engine 5 lớp", desc: "Chưa học → Đang học → Quen thuộc → Ôn tập → Đã thuộc, chuyển lớp tự động." },
      { title: "Giữ streak", desc: "Ôn đủ thẻ đến hạn mỗi ngày để giữ chuỗi ngày học liên tục." },
      { title: "Hẹn giờ thông minh", desc: "Thẻ khó ôn sớm hơn, thẻ dễ giãn cách xa hơn — tiết kiệm thời gian." },
    ],
    howEyebrow: "Cách dùng",
    howTitle: "Học, đánh giá, quay lại đúng hẹn",
    howSubtitle: "Vòng lặp SRS chạy ngầm sau mỗi phiên học của bạn.",
    steps: [
      { title: "Học như bình thường", desc: "Dùng Flashcard hoặc Learn, mỗi câu trả lời đều ghi nhận mức nhớ." },
      { title: "Nhận lịch ôn", desc: "Engine hẹn ngày ôn tiếp theo cho từng thẻ (ví dụ: 1 ngày, 3 ngày, 1 tuần)." },
      { title: "Xử lý thẻ đến hạn", desc: "Mở banner ôn tập mỗi ngày để dọn hết thẻ due và giữ streak." },
    ],
    previewNote: "Banner ôn tập và lịch SRS mẫu trong dashboard.",
  },
  progress: {
    badge: "Tiến độ · Mastery & SRS",
    heroTitle: "Nhìn rõ mình thuộc tới đâu",
    heroSubtitle:
      "Tỉ lệ thành thạo, phân bố 4 trạng thái kiến thức và điểm ghi nhớ trên mọi học phần — cập nhật theo thời gian thực.",
    primaryCta: "Xem tiến độ của tôi",
    secondaryCta: "Tạo học phần",
    featuresEyebrow: "Tính năng",
    featuresTitle: "Mọi con số học tập ở một nơi",
    featuresSubtitle: "Dashboard tiến độ tổng hợp từ mọi phiên Flashcard và Learn.",
    features: [
      { title: "Tỉ lệ nắm vững", desc: "Phần trăm thẻ đã thuộc trên tổng số thẻ đang học." },
      { title: "Phân bố kiến thức", desc: "Đã thuộc / Đang ôn / Đang học / Chưa học theo từng thanh trực quan." },
      { title: "Điểm ghi nhớ", desc: "Retention score phản ánh khả năng nhớ dài hạn của bạn." },
      { title: "Thẻ đến hạn SRS", desc: "Số thẻ cần ôn hôm nay, liên thông trực tiếp sang phiên ôn." },
    ],
    howEyebrow: "Cách dùng",
    howTitle: "Học càng nhiều, số liệu càng rõ",
    howSubtitle: "Không cần nhập liệu — học là số liệu tự đầy.",
    steps: [
      { title: "Tạo và học", desc: "Tạo học phần rồi học bằng Flashcard hoặc Learn mỗi ngày." },
      { title: "Mở trang Tiến độ", desc: "Xem mastery, phân bố trạng thái và lịch SRS tổng hợp." },
      { title: "Đặt lại khi cần", desc: "Muốn học lại từ đầu? Reset tiến độ mà không mất thẻ." },
    ],
    previewNote: "Dashboard tiến độ mẫu với mastery và phân bố kiến thức.",
  },
  test: {
    badge: "Kiểm tra · Sắp có",
    heroTitle: "Bài kiểm tra từ mọi học phần",
    heroSubtitle:
      "Tự sinh đề trắc nghiệm + tự luận từ thẻ của bạn, tính giờ và chấm điểm tự động — tính năng đang hoàn thiện.",
    primaryCta: "Đăng ký miễn phí",
    secondaryCta: "Tạo học phần trước",
    featuresEyebrow: "Sắp ra mắt",
    featuresTitle: "Những gì chế độ Kiểm tra sẽ có",
    featuresSubtitle: "Thiết kế bám đúng cấu trúc đề kiểm tra kiến thức nhanh.",
    features: [
      { title: "Sinh đề tự động", desc: "Trộn trắc nghiệm, đúng/sai và tự luận từ chính học phần của bạn." },
      { title: "Tính giờ làm bài", desc: "Bấm giờ từng đề để luyện áp lực phòng thi." },
      { title: "Chấm điểm tức thì", desc: "Nộp bài là có điểm, đáp án đúng và thẻ cần ôn lại." },
      { title: "Lịch sử điểm", desc: "Theo dõi điểm qua từng lần làm để thấy tiến bộ." },
    ],
    howEyebrow: "Lộ trình",
    howTitle: "Sắp có trong bản tới",
    howSubtitle: "Hiện tại bạn có thể học trước bằng Flashcard và Learn.",
    steps: [
      { title: "Tạo học phần ngay", desc: "Thẻ bạn tạo hôm nay sẽ dùng được luôn khi Kiểm tra ra mắt." },
      { title: "Học bằng Learn", desc: "Làm quen với 4 dạng câu hỏi — đề kiểm tra dùng chung ngân hàng câu hỏi." },
      { title: "Nhận thông báo", desc: "Đăng ký tài khoản miễn phí để được báo khi tính năng mở." },
    ],
    previewNote: "Bản xem trước ý tưởng chế độ Kiểm tra (chưa phát hành).",
  },
  groups: {
    badge: "Nhóm học · Sắp có",
    heroTitle: "Học cùng nhau, tiến xa hơn",
    heroSubtitle:
      "Chia sẻ học phần, cùng ôn và đua streak trong nhóm — tính năng đang hoàn thiện cho nhóm học tập.",
    primaryCta: "Đăng ký miễn phí",
    secondaryCta: "Tạo học phần trước",
    featuresEyebrow: "Sắp ra mắt",
    featuresTitle: "Những gì Nhóm học sẽ có",
    featuresSubtitle: "Cho lớp học, câu lạc bộ và nhóm bạn cùng mục tiêu.",
    features: [
      { title: "Chia sẻ học phần", desc: "Một link là cả nhóm cùng học chung một bộ thẻ." },
      { title: "Cùng ôn mỗi ngày", desc: "Nhắc nhau xử lý thẻ đến hạn, giữ streak nhóm." },
      { title: "Bảng tiến độ nhóm", desc: "Xem ai thuộc bao nhiêu %, ai cần hỗ trợ thêm." },
      { title: "Quyền riêng tư", desc: "Nhóm công khai hoặc riêng tư — bạn chọn ai được tham gia." },
    ],
    howEyebrow: "Lộ trình",
    howTitle: "Sắp có trong bản tới",
    howSubtitle: "Chuẩn bị học phần từ hôm nay để mời nhóm vào học ngay khi mở.",
    steps: [
      { title: "Tạo học phần chung", desc: "Soạn bộ thẻ cho nhóm — môn học, kỳ thi, từ vựng." },
      { title: "Mời bạn cùng học", desc: "Chia sẻ link học phần cho bạn bè trong nhóm." },
      { title: "Cùng giữ streak", desc: "Ôn mỗi ngày và theo dõi tiến độ của cả nhóm." },
    ],
    previewNote: "Bản xem trước ý tưởng Nhóm học (chưa phát hành).",
  },
  live: {
    badge: "Live · Dành cho giáo viên · Sắp có",
    heroTitle: "Lớp học trực tiếp trên Flashwise",
    heroSubtitle:
      "Giáo viên mở phòng live, học sinh tham gia trả lời theo thời gian thực — tính năng đang hoàn thiện.",
    primaryCta: "Đăng ký miễn phí",
    secondaryCta: "Tạo học phần trước",
    featuresEyebrow: "Sắp ra mắt",
    featuresTitle: "Những gì Live sẽ có",
    featuresSubtitle: "Biến học phần tĩnh thành buổi học tương tác trực tiếp.",
    features: [
      { title: "Phòng live tức thì", desc: "Mở phòng từ bất kỳ học phần nào, học sinh vào bằng mã phòng." },
      { title: "Trả lời thời gian thực", desc: "Cả lớp cùng trả lời câu hỏi, xem bảng xếp hạng trực tiếp." },
      { title: "Điều khiển của giáo viên", desc: "Giáo viên chuyển câu hỏi, khóa đáp án và xem tỉ lệ đúng." },
      { title: "Ôn lại sau buổi live", desc: "Kết quả buổi live tự chuyển thành lịch SRS cho từng học sinh." },
    ],
    howEyebrow: "Lộ trình",
    howTitle: "Sắp có trong bản tới",
    howSubtitle: "Giáo viên có thể soạn học phần từ hôm nay để dùng ngay khi mở.",
    steps: [
      { title: "Soạn học phần", desc: "Chuẩn bị bộ thẻ cho buổi dạy — thuật ngữ, định nghĩa, gợi ý." },
      { title: "Mở phòng live", desc: "Một chạm để mở phòng, chia sẻ mã cho cả lớp." },
      { title: "Dạy và chấm", desc: "Học sinh trả lời trực tiếp, kết quả tự đồng bộ tiến độ." },
    ],
    previewNote: "Bản xem trước ý tưởng lớp Live (chưa phát hành).",
  },
};

const EN: Record<ToolSlug, ToolCopy> = {
  flashcards: {
    badge: "Flashcards · 3D flip",
    heroTitle: "Memorize faster with 3D Flashcards",
    heroSubtitle:
      "Flip, shuffle, autoplay and fullscreen — everything is already in the app, free for learners.",
    primaryCta: "Open flashcards now",
    secondaryCta: "Create a study set",
    featuresEyebrow: "Features",
    featuresTitle: "One set, memorize every way",
    featuresSubtitle: "3D flashcard mode built on the app design tokens — fast and smooth.",
    features: [
      { title: "Smooth 3D flip", desc: "Perspective flip with Space key, flip button and swipe support." },
      { title: "Shuffle", desc: "Randomize card order every round to avoid position memory." },
      { title: "Autoplay + Fullscreen", desc: "Auto-advance cards, fullscreen for focused study." },
      { title: "Hints + Pronunciation", desc: "Hints per card, term audio and starring for extra review." },
    ],
    howEyebrow: "How to use",
    howTitle: "Create cards, flip cards, master them",
    howSubtitle: "Three steps only — no setup required.",
    steps: [
      { title: "Create a set", desc: "Add terms manually or import 1,000 lines from text in seconds." },
      { title: "Flip and self-test", desc: "Read the term, guess the definition, flip to check. Star hard cards." },
      { title: "Shuffle and repeat", desc: "Turn on shuffle, run autoplay and come back daily to keep streak." },
    ],
    previewNote: "Preview of the real flashcard UI in the app.",
  },
  learn: {
    badge: "Adaptive learn · MCQ + Written",
    heroTitle: "Study your gaps with Learn",
    heroSubtitle:
      "Adaptive engine mixes MCQ, true/false, written and self-graded recall — instant grading with SRS scheduling.",
    primaryCta: "Start learning now",
    secondaryCta: "Create a study set",
    featuresEyebrow: "Features",
    featuresTitle: "Four question types, one engine",
    featuresSubtitle: "Every answer updates mastery score and SRS schedule.",
    features: [
      { title: "Multiple choice", desc: "Pick the right definition from 4 options with smart distractors." },
      { title: "True / False", desc: "Fast proposition checks for recall reflexes." },
      { title: "Written recall", desc: "Type definitions to force active recall instead of recognition." },
      { title: "Grading + SRS", desc: "Instant explanations plus recall rating for next review date." },
    ],
    howEyebrow: "How to use",
    howTitle: "Open a Learn session, answer, level up",
    howSubtitle: "Sessions adapt to your level automatically.",
    steps: [
      { title: "Open a set", desc: "From the set detail page, start Study with Learn Mode." },
      { title: "Answer continuously", desc: "Go through MCQ, true/false and written with instant feedback." },
      { title: "Rate your recall", desc: "Pick Repeat / Hard / Okay / Easy for optimal SRS scheduling." },
    ],
    previewNote: "Sample Learn session: questions, feedback and SRS bar.",
  },
  srs: {
    badge: "Spaced repetition · 5-layer engine",
    heroTitle: "Review on time, remember longer",
    heroSubtitle:
      "Daily due banner plus smart 5-layer SRS scheduling keeps streaks alive with zero bookkeeping.",
    primaryCta: "See due cards",
    secondaryCta: "Create a study set",
    featuresEyebrow: "Features",
    featuresTitle: "Study less, remember longer",
    featuresSubtitle: "Scheduling based on your most recent answer per card.",
    features: [
      { title: "Due banner", desc: "Open the dashboard and instantly see today's due cards." },
      { title: "5-layer engine", desc: "Not studied → Learning → Familiar → Reviewing → Mastered, auto-promoted." },
      { title: "Keep streaks", desc: "Clear daily dues to keep your study streak alive." },
      { title: "Smart intervals", desc: "Hard cards return sooner, easy cards spaced further — save time." },
    ],
    howEyebrow: "How to use",
    howTitle: "Study, rate, return on schedule",
    howSubtitle: "The SRS loop runs quietly behind every session.",
    steps: [
      { title: "Study normally", desc: "Use Flashcards or Learn; every answer records recall level." },
      { title: "Get scheduled", desc: "Engine sets the next review date per card (1 day, 3 days, 1 week)." },
      { title: "Clear dues", desc: "Open the review banner daily to clear dues and keep streak." },
    ],
    previewNote: "Sample review banner and SRS schedule in the dashboard.",
  },
  progress: {
    badge: "Progress · Mastery & SRS",
    heroTitle: "See exactly how much you know",
    heroSubtitle:
      "Mastery rate, 4-state knowledge distribution and retention score across all sets — updated in real time.",
    primaryCta: "View my progress",
    secondaryCta: "Create a study set",
    featuresEyebrow: "Features",
    featuresTitle: "Every study number in one place",
    featuresSubtitle: "Progress dashboard aggregated from all Flashcard and Learn sessions.",
    features: [
      { title: "Mastery rate", desc: "Share of mastered cards across all active sets." },
      { title: "Knowledge distribution", desc: "Mastered / Reviewing / Learning / Not studied as visual bars." },
      { title: "Retention score", desc: "Overall long-term retention indicator." },
      { title: "SRS dues", desc: "Cards due today, linked straight into a review session." },
    ],
    howEyebrow: "How to use",
    howTitle: "The more you study, the clearer it gets",
    howSubtitle: "No data entry — studying fills the numbers automatically.",
    steps: [
      { title: "Create and study", desc: "Create sets and study with Flashcards or Learn daily." },
      { title: "Open Progress", desc: "See mastery, state distribution and combined SRS schedule." },
      { title: "Reset when needed", desc: "Restart from zero without losing cards." },
    ],
    previewNote: "Sample progress dashboard with mastery and distribution.",
  },
  test: {
    badge: "Test · Coming soon",
    heroTitle: "Test yourself from any set",
    heroSubtitle:
      "Auto-generated MCQ + written tests from your cards with timer and auto-grading — in progress.",
    primaryCta: "Sign up free",
    secondaryCta: "Create a set first",
    featuresEyebrow: "Coming soon",
    featuresTitle: "What Test mode will include",
    featuresSubtitle: "Designed like a quick knowledge-check exam.",
    features: [
      { title: "Auto-generated papers", desc: "Mix MCQ, true/false and written from your own set." },
      { title: "Timed sessions", desc: "Countdown per paper to practice exam pressure." },
      { title: "Instant grading", desc: "Score, correct answers and cards to review on submit." },
      { title: "Score history", desc: "Track scores across attempts to see improvement." },
    ],
    howEyebrow: "Roadmap",
    howTitle: "Coming in the next release",
    howSubtitle: "You can already study with Flashcards and Learn today.",
    steps: [
      { title: "Create a set now", desc: "Cards you create today will work in Test mode on launch." },
      { title: "Study with Learn", desc: "Get used to 4 question types — Test shares the bank." },
      { title: "Get notified", desc: "Create a free account to be notified at launch." },
    ],
    previewNote: "Concept preview of Test mode (unreleased).",
  },
  groups: {
    badge: "Study groups · Coming soon",
    heroTitle: "Learn together, go further",
    heroSubtitle:
      "Share sets, review together and race streaks in a group — in progress for study teams.",
    primaryCta: "Sign up free",
    secondaryCta: "Create a set first",
    featuresEyebrow: "Coming soon",
    featuresTitle: "What Study groups will include",
    featuresSubtitle: "For classes, clubs and friends with shared goals.",
    features: [
      { title: "Set sharing", desc: "One link and the whole group studies the same deck." },
      { title: "Daily review together", desc: "Remind each other to clear dues and keep group streak." },
      { title: "Group leaderboard", desc: "See who mastered what and who needs help." },
      { title: "Privacy controls", desc: "Public or private groups — you choose who joins." },
    ],
    howEyebrow: "Roadmap",
    howTitle: "Coming in the next release",
    howSubtitle: "Prepare sets today to invite your group at launch.",
    steps: [
      { title: "Create a shared set", desc: "Build a deck for the group — subject, exam, vocabulary." },
      { title: "Invite friends", desc: "Share the set link with your study buddies." },
      { title: "Keep the streak", desc: "Review daily and track the whole group's progress." },
    ],
    previewNote: "Concept preview of Study groups (unreleased).",
  },
  live: {
    badge: "Live · For teachers · Coming soon",
    heroTitle: "Live classes on Flashwise",
    heroSubtitle:
      "Teachers open a live room, students join and answer in real time — in progress.",
    primaryCta: "Sign up free",
    secondaryCta: "Create a set first",
    featuresEyebrow: "Coming soon",
    featuresTitle: "What Live will include",
    featuresSubtitle: "Turn static sets into interactive live lessons.",
    features: [
      { title: "Instant rooms", desc: "Open a room from any set; students join with a code." },
      { title: "Real-time answers", desc: "The whole class answers together with a live leaderboard." },
      { title: "Teacher controls", desc: "Advance questions, lock answers and see correct rates." },
      { title: "Post-live review", desc: "Live results convert into SRS schedules per student." },
    ],
    howEyebrow: "Roadmap",
    howTitle: "Coming in the next release",
    howSubtitle: "Teachers can prepare sets today to use at launch.",
    steps: [
      { title: "Prepare a set", desc: "Build the deck for your lesson — terms, definitions, hints." },
      { title: "Open a live room", desc: "One tap to open a room and share the code with class." },
      { title: "Teach and grade", desc: "Students answer live; results sync to progress automatically." },
    ],
    previewNote: "Concept preview of Live classes (unreleased).",
  },
};

export function getToolCopy(locale: string, slug: ToolSlug): ToolCopy {
  if (locale === "vi") return VI[slug];
  // ja/ko/zh tạm fallback en để không vỡ key; đủ SEO tiếng Anh, bổ sung sau.
  return EN[slug];
}

export function getToolMeta(locale: string, slug: ToolSlug) {
  const copy = getToolCopy(locale, slug);
  return { title: copy.heroTitle, description: copy.heroSubtitle };
}
