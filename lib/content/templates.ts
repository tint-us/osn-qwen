const CSV_TEMPLATE = `tingkat,level,matpel,questionType,content,options,correctOption,acceptableAnswers,explanation
SMA,OSNP,Matematika,MULTIPLE_CHOICE,"Hitung nilai dari $\\int_0^1 x^2 \\, dx$","[""1/3"",""1/2"",""1"",""0""]",0,[],"Integral dari $x^2$ adalah $\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\frac{1}{3}$."
SMA,OSNP,Fisika,SHORT_ANSWER,"Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",[],null,"[""3e8"",""300000000""]","Kecepatan cahaya adalah $3 \\times 10^8$ m/s."
SMA,OSNP,Matematika,ESSAY,"Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\text{ m/s}$. Berapa ketinggian maksimum? (g = 10 m/s²)",[],null,"[""20""]","$h = \\frac{v_0^2}{2g} = \\frac{400}{20} = 20$ meter."`;

const JSON_TEMPLATE = `[
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "MULTIPLE_CHOICE",
    "content": "Hitung nilai dari $\\\\int_0^1 x^2 \\\\, dx$",
    "options": ["1/3", "1/2", "1", "0"],
    "correctOption": 0,
    "acceptableAnswers": [],
    "explanation": "Integral dari $x^2$ adalah $\\\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\\\frac{1}{3}$."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Fisika",
    "questionType": "SHORT_ANSWER",
    "content": "Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["3e8", "300000000", "3x10^8"],
    "explanation": "Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \\\\times 10^8$ m/s."
  },
  {
    "tingkat": "SMA",
    "level": "OSNP",
    "matpel": "Matematika",
    "questionType": "ESSAY",
    "content": "Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\\\text{ m/s}$. Berapa ketinggian maksimum yang dicapai bola? (g = 10 m/s²)",
    "options": [],
    "correctOption": null,
    "acceptableAnswers": ["20"],
    "explanation": "Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \\\\frac{v_0^2}{2g} = \\\\frac{400}{20} = 20$ meter."
  }
]`;

const XML_TEMPLATE = `<?xml version="1.0" encoding="UTF-8"?>
<questions>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Matematika</matpel>
    <questionType>MULTIPLE_CHOICE</questionType>
    <content>Hitung nilai dari $\\int_0^1 x^2 \\, dx$</content>
    <options>["1/3", "1/2", "1", "0"]</options>
    <correctOption>0</correctOption>
    <acceptableAnswers>[]</acceptableAnswers>
    <explanation>Integral dari $x^2$ adalah $\\frac{x^3}{3}$, evaluasi dari 0 ke 1 memberikan $\\frac{1}{3}$.</explanation>
  </question>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Fisika</matpel>
    <questionType>SHORT_ANSWER</questionType>
    <content>Berapa kecepatan cahaya dalam ruang hampa (dalam m/s)?</content>
    <options>[]</options>
    <correctOption>null</correctOption>
    <acceptableAnswers>["3e8", "300000000", "3x10^8"]</acceptableAnswers>
    <explanation>Kecepatan cahaya dalam ruang hampa adalah tepat 299.792.458 m/s, dibulatkan menjadi $3 \\times 10^8$ m/s.</explanation>
  </question>
  <question>
    <tingkat>SMA</tingkat>
    <level>OSNP</level>
    <matpel>Matematika</matpel>
    <questionType>ESSAY</questionType>
    <content>Sebuah bola dilempar vertikal ke atas dengan kecepatan awal $20 \\text{ m/s}$. Berapa ketinggian maksimum? (g = 10 m/s²)</content>
    <options>[]</options>
    <correctOption>null</correctOption>
    <acceptableAnswers>["20"]</acceptableAnswers>
    <explanation>Dengan $v_0 = 20$ m/s dan $g = 10$ m/s², ketinggian maksimum adalah $h = \\frac{v_0^2}{2g} = \\frac{400}{20} = 20$ meter.</explanation>
  </question>
</questions>`;

export function getTemplate(format: "csv" | "json" | "xml"): string {
  switch (format) {
    case "csv":
      return CSV_TEMPLATE;
    case "json":
      return JSON_TEMPLATE;
    case "xml":
      return XML_TEMPLATE;
    default:
      throw new Error("Format template tidak valid");
  }
}

export function getTemplateContentType(format: "csv" | "json" | "xml"): string {
  switch (format) {
    case "csv":
      return "text/csv";
    case "json":
      return "application/json";
    case "xml":
      return "application/xml";
    default:
      return "text/plain";
  }
}
