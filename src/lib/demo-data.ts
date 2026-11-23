import type { LessonScript } from "@/types/mathspeak";

export const SAMPLE_INPUT_12 = `KẾ HOẠCH BÀI DẠY TOÁN 12 (CTGDPT 2018)
Bài 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ (Tiết 1)
Thời lượng: 45 phút

I. MỤC TIÊU
- Nhận biết tính đồng biến, nghịch biến của hàm số dựa vào dấu của đạo hàm f'(x).
- Lập bảng biến thiên xác định các khoảng đơn điệu của hàm đa thức bậc ba.

II. TIẾN TRÌNH DẠY HỌC
1. Hoạt động 1: Khởi động (5 phút)
- Chiếu đồ thị mực nước thủy triều theo thời gian t trong đoạn [0, 12]. Hỏi khoảng nào tăng, khoảng nào giảm.
2. Hoạt động 2: Hình thành kiến thức mới (15 phút)
- Định lí dấu đạo hàm: f'(x) > 0 trên K => đồng biến; f'(x) < 0 trên K => nghịch biến.
- Chú ý: f'(x) >= 0 trên K và bằng 0 tại hữu hạn điểm vẫn đồng biến.
3. Hoạt động 3: Luyện tập (18 phút)
- Ví dụ: Tìm các khoảng đơn điệu của hàm số y = x^3 - 3x^2 + 2 qua 4 bước chuẩn.
4. Hoạt động 4: Vận dụng & Củng cố (7 phút)
- Liên hệ vận tốc v(t) = s'(t) trong Vật lí và dặn dò bài tập về nhà.`;

export const DEMO_LESSON: LessonScript = {
  id: "demo-math12-monotonicity",
  grade: "Lớp 12",
  duration: "45 phút",
  title_en: "Monotonicity and Extrema of Functions (Period 1)",
  title_vi: "Tính đơn điệu và cực trị của hàm số (Tiết 1)",
  source: "Bài mẫu sẵn có",
  is_demo: true,
  mastered_line_ids: [],
  stages: [
    {
      id: "st1",
      name_en: "Activity 1: Warm-up",
      name_vi: "Hoạt động 1: Khởi động (5 phút)",
      lines: [
        {
          id: "l1",
          role: "Teacher",
          display_en:
            "Good morning, class! Today we are starting a key topic in Grade 12 Calculus: the monotonicity of functions.",
          spoken_en:
            "Good morning, class! Today we are starting a key topic in Grade 12 Calculus: the monotonicity of functions.",
          vi: "Chào buổi sáng cả lớp! Hôm nay chúng ta bắt đầu một chủ đề trọng tâm của Giải tích 12: tính đơn điệu của hàm số.",
          ipa_tip: "monotonicity /ˌmɒn.ə.təˈnɪs.ə.ti/ • calculus /ˈkæl.kjə.ləs/",
        },
        {
          id: "l2",
          role: "Teacher",
          display_en:
            "Look at the tide-level graph for $t \\in [0, 12]$. Over which intervals is the water level rising, and when is it falling?",
          spoken_en:
            "Look at the tide-level graph for t belonging to the closed interval from zero to twelve. Over which intervals is the water level rising, and when is it falling?",
          vi: "Các em hãy nhìn biểu đồ mực nước thủy triều với t thuộc [0, 12]. Khoảng nào mực nước tăng, khoảng nào giảm?",
          ipa_tip: "interval /ˈɪn.tə.vəl/ • closed interval (đoạn đóng)",
        },
      ],
    },
    {
      id: "st2",
      name_en: "Activity 2: New Knowledge",
      name_vi: "Hoạt động 2: Hình thành kiến thức mới (15 phút)",
      lines: [
        {
          id: "l3",
          role: "Board",
          display_en:
            "Theorem: Let $y = f(x)$ be differentiable on $K$. If $f'(x) > 0, \\forall x \\in K$, then $f$ is increasing on $K$.",
          spoken_en:
            "Theorem: Let y equal f of x be differentiable on K. If f prime of x is greater than zero for all x in K, then f is increasing on K.",
          vi: "(Ghi bảng) Định lí: Cho y = f(x) có đạo hàm trên K. Nếu f'(x) > 0 với mọi x thuộc K thì f đồng biến trên K.",
          ipa_tip: "differentiable /ˌdɪf.əˈren.ʃə.bəl/ • f'(x) đọc 'f prime of x'",
        },
        {
          id: "l4",
          role: "Teacher",
          display_en:
            "Remember this remark: if $f'(x) \\ge 0$ on $K$ and $f'(x) = 0$ at only a finite number of points, the function is still increasing on $K$.",
          spoken_en:
            "Remember this remark: if f prime of x is greater than or equal to zero on K and f prime of x equals zero at only a finite number of points, the function is still increasing on K.",
          vi: "Lưu ý nhận xét: nếu f'(x) ≥ 0 trên K và chỉ bằng 0 tại hữu hạn điểm thì hàm số vẫn đồng biến trên K.",
          ipa_tip: "finite /ˈfaɪ.naɪt/ (nhấn âm 1)",
        },
      ],
    },
    {
      id: "st3",
      name_en: "Activity 3: Guided Practice",
      name_vi: "Hoạt động 3: Luyện tập (18 phút)",
      lines: [
        {
          id: "l5",
          role: "Teacher",
          display_en:
            "Example 1: Find the intervals of monotonicity of the cubic function $y = x^3 - 3x^2 + 2$.",
          spoken_en:
            "Example 1: Find the intervals of monotonicity of the cubic function y equals x cubed minus three x squared plus two.",
          vi: "Ví dụ 1: Tìm các khoảng đơn điệu của hàm bậc ba y = x³ - 3x² + 2.",
          ipa_tip: "cubic /ˈkjuː.bɪk/ • x^3 đọc 'x cubed'",
        },
        {
          id: "l6",
          role: "Board",
          display_en:
            "Step 1: Domain $D = \\mathbb{R}$. Step 2: $y' = 3x^2 - 6x = 0 \\Leftrightarrow x = 0$ or $x = 2$.",
          spoken_en:
            "Step 1: Domain D equals the set of all real numbers. Step 2: y prime equals three x squared minus six x equals zero, which is equivalent to x equals zero or x equals two.",
          vi: "(Ghi bảng) Bước 1: TXĐ D = R. Bước 2: y' = 3x² - 6x = 0 ⇔ x = 0 hoặc x = 2.",
          ipa_tip: "domain /dəʊˈmeɪn/ • equivalent /ɪˈkwɪv.ə.lənt/",
        },
      ],
    },
    {
      id: "st4",
      name_en: "Activity 4: Application & Wrap-up",
      name_vi: "Hoạt động 4: Vận dụng & Củng cố (7 phút)",
      lines: [
        {
          id: "l7",
          role: "Teacher",
          display_en:
            "In physics, velocity is the derivative of displacement: $v(t) = s'(t)$. Great job today, everyone!",
          spoken_en:
            "In physics, velocity is the derivative of displacement: v of t equals s prime of t. Great job today, everyone!",
          vi: "Trong vật lí, vận tốc là đạo hàm của độ dịch chuyển: v(t) = s'(t). Hôm nay cả lớp làm rất tốt!",
          ipa_tip: "velocity /vəˈlɒs.ə.ti/ • displacement /dɪˈspleɪs.mənt/",
        },
      ],
    },
  ],
  vocab: [
    {
      symbol_latex: "f'(x) > 0",
      term_en: "Positive first derivative",
      spoken_how: "f prime of x is greater than zero",
      ipa: "/ɛf praɪm əv ɛks ɪz ˈɡreɪ.tər ðæn ˈzɪə.rəʊ/",
      meaning_vi: "Đạo hàm cấp một dương",
    },
    {
      symbol_latex: "\\forall x \\in K",
      term_en: "For all x in K",
      spoken_how: "for all x belonging to K",
      ipa: "/fɔːr ɔːl ɛks bɪˈlɒŋ.ɪŋ tuː keɪ/",
      meaning_vi: "Với mọi x thuộc K",
    },
    {
      symbol_latex: "D = \\mathbb{R}",
      term_en: "Domain is all real numbers",
      spoken_how: "the domain D equals the set of all real numbers",
      ipa: "/ðə dəʊˈmeɪn diː ˈiː.kwəlz ðə sɛt əv ɔːl rɪəl ˈnʌm.bəz/",
      meaning_vi: "Tập xác định là tập số thực",
    },
    {
      symbol_latex: "y = x^3 - 3x^2 + 2",
      term_en: "Cubic polynomial function",
      spoken_how: "y equals x cubed minus three x squared plus two",
      ipa: "/waɪ ˈiː.kwəlz ɛks kjuːbd ˈmaɪ.nəs θriː ɛks skweəd plʌs tuː/",
      meaning_vi: "Hàm đa thức bậc ba",
    },
  ],
};
