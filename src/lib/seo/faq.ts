import type { ToolSlug } from "@/components/landing/tools/toolLandingData";

export interface FaqItem {
  q: string;
  a: string;
}

const HOME_VI: FaqItem[] = [
  {
    q: "Flashwise là gì?",
    a: "Flashwise là nền tảng flashcard miễn phí giúp bạn ghi nhớ nhanh: thẻ lật 3D, chế độ học thích ứng Learn, lặp lại ngắt quãng SRS 5 tầng và dashboard theo dõi tiến độ. Bạn tạo học phần trong 1 phút và học ngay trên web lẫn mobile.",
  },
  {
    q: "Flashwise có miễn phí không?",
    a: "Có. Người học dùng miễn phí toàn bộ tính năng cốt lõi: tạo học phần, flashcard 3D, Learn thích ứng, nhắc ôn SRS và theo dõi tiến độ. Đăng ký chỉ cần email, không yêu cầu thẻ thanh toán.",
  },
  {
    q: "Chế độ Learn khác Flashcard như thế nào?",
    a: "Flashcard dùng để ghi nhớ nhanh bằng lật thẻ, xáo trộn và tự phát. Learn là engine thích ứng trộn trắc nghiệm, đúng/sai và tự luận, chấm tức thì và tự xếp lịch ôn SRS theo mức nhớ của từng thẻ.",
  },
  {
    q: "SRS 5 tầng của Flashwise hoạt động ra sao?",
    a: "Mỗi thẻ đi qua 5 trạng thái: Chưa học, Đang học, Quen thuộc, Ôn tập, Đã thuộc. Mỗi câu trả lời cập nhật mức nhớ và hẹn ngày ôn tiếp theo, banner đến hạn nhắc bạn ôn đúng ngày để giữ streak.",
  },
  {
    q: "Tạo học phần mất bao lâu?",
    a: "Chưa tới 1 phút. Bạn nhập thuật ngữ thủ công hoặc dán 1000 dòng từ Word, Excel, Google Docs, chọn công khai hoặc riêng tư là học được ngay.",
  },
  {
    q: "Flashwise hỗ trợ những ngôn ngữ nào?",
    a: "Flashwise hỗ trợ 5 ngôn ngữ: Tiếng Việt, English, 简体中文, 日本語 và 한국어. Nội dung học phần do bạn tự tạo nên học được mọi môn, mọi ngoại ngữ.",
  },
];

const HOME_EN: FaqItem[] = [
  {
    q: "What is Flashwise?",
    a: "Flashwise is a free flashcard platform for fast memorization: 3D flip cards, adaptive Learn mode, 5-layer spaced repetition SRS and a progress dashboard. Create a study set in 1 minute and study on web and mobile.",
  },
  {
    q: "Is Flashwise free?",
    a: "Yes. Learners use all core features for free: study sets, 3D flashcards, adaptive Learn, SRS due reminders and progress tracking. Sign up with email only, no credit card required.",
  },
  {
    q: "How is Learn different from Flashcards?",
    a: "Flashcards are for fast memorization with flip, shuffle and autoplay. Learn is an adaptive engine mixing multiple-choice, true/false and written recall with instant grading and SRS scheduling per card.",
  },
  {
    q: "How does the 5-layer SRS work?",
    a: "Each card moves through Not studied, Learning, Familiar, Reviewing and Mastered. Every answer updates recall level and schedules the next review date, with a daily due banner to keep your streak.",
  },
  {
    q: "How long does it take to create a set?",
    a: "Under 1 minute. Add terms manually or paste 1,000 lines from Word, Excel or Google Docs, choose public or private, and start studying right away.",
  },
  {
    q: "Which languages does Flashwise support?",
    a: "Flashwise supports 5 UI languages: Vietnamese, English, Simplified Chinese, Japanese and Korean. Set content is yours, so you can study any subject in any language.",
  },
];

export function homeFaq(locale: string): FaqItem[] {
  return locale === "en" ? HOME_EN : HOME_VI;
}

const TOOL_VI: Record<string, FaqItem[]> = {
  flashcards: [
    {
      q: "Flashcard 3D của Flashwise có gì đặc biệt?",
      a: "Flashcard 3D của Flashwise lật mượt với hiệu ứng perspective, hỗ trợ phím Space, nút lật và vuốt trên mobile, kèm xáo trộn, tự phát, toàn màn hình, gợi ý và phát âm thuật ngữ.",
    },
    {
      q: "Cách học flashcard hiệu quả nhất?",
      a: "Tạo học phần, đọc thuật ngữ rồi đoán định nghĩa trước khi lật, gắn sao thẻ khó, bật xáo trộn mỗi vòng và quay lại ôn đúng ngày SRS nhắc để giữ streak.",
    },
    {
      q: "Nhập nhiều thẻ cùng lúc được không?",
      a: "Được. Bạn dán tới 1000 dòng từ văn bản Word, Excel hoặc Google Docs, Flashwise tự tách thuật ngữ và định nghĩa theo tab, dấu phẩy hoặc dòng mới.",
    },
    {
      q: "Flashcard có miễn phí không?",
      a: "Có, toàn bộ chế độ flashcard miễn phí cho người học, không giới hạn số học phần và không cần thẻ thanh toán.",
    },
  ],
  learn: [
    {
      q: "Chế độ Learn của Flashwise là gì?",
      a: "Learn là engine học thích ứng trộn trắc nghiệm 4 đáp án, đúng/sai, tự luận gõ đáp án và tự đánh giá mức nhớ, chấm tức thì kèm giải thích sau mỗi câu.",
    },
    {
      q: "Learn xếp lịch ôn như thế nào?",
      a: "Sau mỗi câu trả lời bạn đánh giá Lại, Khó, Tạm được hoặc Dễ, engine SRS 5 tầng hẹn ngày ôn tiếp theo cho từng thẻ: thẻ khó ôn sớm, thẻ dễ giãn cách xa.",
    },
    {
      q: "Ai nên dùng Learn?",
      a: "Người ôn thi, học từ vựng ngoại ngữ và sinh viên cần lấp lỗ hổng kiến thức nhanh, vì Learn tự dồn câu hỏi vào chỗ bạn hay sai.",
    },
    {
      q: "Learn có miễn phí không?",
      a: "Có, Learn miễn phí toàn bộ cho người học đã đăng ký tài khoản Flashwise.",
    },
  ],
  srs: [
    {
      q: "SRS 5 tầng của Flashwise là gì?",
      a: "SRS 5 tầng là engine lặp lại ngắt quãng của Flashwise: Chưa học, Đang học, Quen thuộc, Ôn tập, Đã thuộc. Mỗi câu trả lời cập nhật mức nhớ và hẹn ngày ôn tối ưu cho từng thẻ.",
    },
    {
      q: "Banner thẻ đến hạn ở đâu?",
      a: "Ngay trên dashboard sau khi đăng nhập. Banner hiện số thẻ đến hạn hôm nay, bấm Học ngay để dọn hết thẻ due và giữ streak.",
    },
    {
      q: "Ôn SRS mỗi ngày mất bao lâu?",
      a: "Chỉ vài phút nếu bạn ôn đều. Thẻ khó ôn sớm hơn, thẻ dễ giãn cách xa nên tổng thời gian ôn giảm dần mà nhớ lâu hơn.",
    },
    {
      q: "Không ôn đúng hẹn có sao không?",
      a: "Thẻ quá hạn dồn vào banner hôm sau và tụt hạng mức nhớ, bạn chỉ cần mở phiên ôn là engine tự xếp lại lịch phù hợp.",
    },
  ],
  progress: [
    {
      q: "Trang Tiến độ của Flashwise cho biết gì?",
      a: "Trang Tiến độ tổng hợp tỉ lệ nắm vững, phân bố 4 trạng thái kiến thức Đã thuộc, Đang ôn, Đang học, Chưa học, điểm ghi nhớ retention và số thẻ SRS đến hạn trên mọi học phần.",
    },
    {
      q: "Số liệu tiến độ cập nhật khi nào?",
      a: "Theo thời gian thực sau mỗi phiên Flashcard và Learn, không cần nhập liệu thủ công.",
    },
    {
      q: "Có reset tiến độ được không?",
      a: "Được. Bạn reset tiến độ để học lại từ đầu mà không mất thẻ trong học phần.",
    },
    {
      q: "Xem tiến độ có cần trả phí không?",
      a: "Không. Dashboard tiến độ miễn phí cho mọi tài khoản đã đăng nhập.",
    },
  ],
};

const TOOL_EN: Record<string, FaqItem[]> = {
  flashcards: [
    {
      q: "What makes Flashwise 3D flashcards special?",
      a: "Flashwise 3D flashcards flip smoothly with perspective effects, support Space key, flip button and mobile swipe, plus shuffle, autoplay, fullscreen, hints and term pronunciation.",
    },
    {
      q: "What is the most effective flashcard routine?",
      a: "Create a set, guess the definition before flipping, star hard cards, shuffle every round and return on SRS due dates to keep your streak.",
    },
    {
      q: "Can I import many cards at once?",
      a: "Yes. Paste up to 1,000 lines from Word, Excel or Google Docs and Flashwise splits terms and definitions by tab, comma or newline.",
    },
    {
      q: "Are flashcards free?",
      a: "Yes, flashcard mode is fully free for learners with unlimited sets and no credit card required.",
    },
  ],
  learn: [
    {
      q: "What is Flashwise Learn mode?",
      a: "Learn is an adaptive engine mixing 4-option multiple choice, true/false, written recall and self-graded recall with instant explanations after every question.",
    },
    {
      q: "How does Learn schedule reviews?",
      a: "After each answer you rate Repeat, Hard, Okay or Easy, and the 5-layer SRS engine schedules the next review per card: hard cards return sooner, easy cards later.",
    },
    {
      q: "Who should use Learn?",
      a: "Exam takers, language learners and students who need to close knowledge gaps fast, because Learn concentrates questions where you fail most.",
    },
    {
      q: "Is Learn free?",
      a: "Yes, Learn is fully free for registered Flashwise accounts.",
    },
  ],
  srs: [
    {
      q: "What is the Flashwise 5-layer SRS?",
      a: "The 5-layer SRS is the Flashwise spaced repetition engine: Not studied, Learning, Familiar, Reviewing, Mastered. Every answer updates recall level and schedules the optimal next review per card.",
    },
    {
      q: "Where is the due cards banner?",
      a: "Right on the dashboard after login. The banner shows today's due count; click Study now to clear dues and keep your streak.",
    },
    {
      q: "How long is daily SRS review?",
      a: "Just minutes with steady practice. Hard cards return sooner and easy cards space further, so total review time shrinks while retention grows.",
    },
    {
      q: "What if I miss a scheduled review?",
      a: "Overdue cards roll into the next day banner and drop recall level; one review session lets the engine rebuild an optimal schedule.",
    },
  ],
  progress: [
    {
      q: "What does the Flashwise Progress page show?",
      a: "Progress aggregates mastery rate, 4-state knowledge distribution Mastered, Reviewing, Learning, Not studied, retention score and SRS dues across all sets.",
    },
    {
      q: "When does progress update?",
      a: "In real time after every Flashcard and Learn session, with no manual data entry.",
    },
    {
      q: "Can I reset progress?",
      a: "Yes. Reset progress to restart from zero without losing cards in the set.",
    },
    {
      q: "Is progress tracking paid?",
      a: "No. The progress dashboard is free for every logged-in account.",
    },
  ],
};

function genericFaq(locale: string, slug: string): FaqItem[] {
  const isEn = locale === "en";
  const name = slug.charAt(0).toUpperCase() + slug.slice(1);
  return isEn
    ? [
        {
          q: `What is Flashwise ${name}?`,
          a: `Flashwise ${name} helps you study faster with flashcards, adaptive Learn sessions and 5-layer SRS scheduling. Create a free account to get notified at launch.`,
        },
        {
          q: `Is Flashwise ${name} free?`,
          a: `Yes. Create a free Flashwise account today; sets you create now will work in ${name} on launch.`,
        },
        {
          q: `How do I prepare for ${name}?`,
          a: `Create a study set now, study daily with Flashcards and Learn, and you will be ready on day one.`,
        },
        {
          q: `Which languages are supported?`,
          a: `Flashwise supports Vietnamese, English, Simplified Chinese, Japanese and Korean UI with user-created content in any language.`,
        },
      ]
    : [
        {
          q: `Flashwise ${name} là gì?`,
          a: `Flashwise ${name} giúp bạn học nhanh hơn với flashcard, phiên Learn thích ứng và lịch SRS 5 tầng. Tạo tài khoản miễn phí để nhận thông báo khi ra mắt.`,
        },
        {
          q: `${name} có miễn phí không?`,
          a: `Có. Tạo tài khoản Flashwise miễn phí ngay hôm nay; học phần bạn tạo sẽ dùng được luôn khi ${name} ra mắt.`,
        },
        {
          q: `Chuẩn bị gì cho ${name}?`,
          a: `Tạo học phần ngay, học đều bằng Flashcard và Learn mỗi ngày để sẵn sàng từ ngày đầu mở.`,
        },
        {
          q: `Hỗ trợ ngôn ngữ nào?`,
          a: `Flashwise hỗ trợ giao diện Tiếng Việt, English, 简体中文, 日本語, 한국어; nội dung học phần do bạn tạo nên học được mọi ngôn ngữ.`,
        },
      ];
}

export function toolFaq(locale: string, slug: string): FaqItem[] {
  const table = locale === "en" ? TOOL_EN : TOOL_VI;
  return table[slug] ?? genericFaq(locale, slug);
}
