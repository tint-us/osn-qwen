# Feature Architecture — STUDY MODE Module

## 1. Komponen Utama

```
┌─────────────────────────────────────────────────────────────┐
│                      STUDY MODE                              │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ StudyFilter  │  │ QuestionCard │  │  FeedbackPanel   │   │
│  │ Form         │──│              │──│                  │   │
│  │              │  │  - Content   │  │  - Benar/Salah   │   │
│  │  - Tingkat   │  │  - Image     │  │  - Jawaban benar │   │
│  │  - Level     │  │  - LaTeX     │  │  - Pembahasan    │   │
│  │  - Matpel    │  │  - AnswerInput│  │                  │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ StudyProgress│  │ Zustand     │  │  KatexRenderer   │   │
│  │              │  │ StudyStore  │  │  (shared)        │   │
│  │  - Soal X/Y  │  │              │  │                  │   │
│  │  - Benar: N  │  │  - questions │  │  - Inline $...$  │   │
│  │  - Salah: M  │  │  - currentIdx│  │  - Display $$..$$│   │
│  │              │  │  - answers   │  │                  │   │
│  └──────────────┘  │  - results   │  └──────────────────┘   │
│                    └──────────────┘                          │
└─────────────────────────────────────────────────────────────┘
```

## 2. Algoritma Pengacakan Soal

### Fisher-Yates Shuffle (Server-side)

```
Input: questions[] = [Q1, Q2, Q3, Q4, Q5]

Algorithm:
  for i = n-1 downto 1:
    j = random(0, i)        // inclusive
    swap(questions[i], questions[j])

Output: questions[] = [Q3, Q1, Q5, Q2, Q4]  // contoh hasil

Complexity: O(n)
```

### Implementasi di Service Layer

```typescript
// lib/services/study-service.ts
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
```

## 3. Algoritma Pengacakan Pilihan Jawaban (MULTIPLE_CHOICE)

### Problem
- `correctOption` adalah index ke `options[]`
- Jika options diacak, index correctOption juga harus di-update

### Solution

```
Input:
  options = ["A. 10", "B. 20", "C. 30", "D. 40"]
  correctOption = 2  // "C. 30"

Step 1: Buat array mapping dengan originalIndex
  mapping = [
    { text: "A. 10", originalIndex: 0 },
    { text: "B. 20", originalIndex: 1 },
    { text: "C. 30", originalIndex: 2 },
    { text: "D. 40", originalIndex: 3 },
  ]

Step 2: Shuffle mapping (Fisher-Yates)
  shuffled = [
    { text: "C. 30", originalIndex: 2 },
    { text: "A. 10", originalIndex: 0 },
    { text: "D. 40", originalIndex: 3 },
    { text: "B. 20", originalIndex: 1 },
  ]

Step 3: Build new options dan new correctOption
  newOptions = ["C. 30", "A. 10", "D. 40", "B. 20"]
  newCorrectOption = shuffled.findIndex(item => item.originalIndex === 2)
  newCorrectOption = 0  // "C. 30" sekarang di index 0

Output:
  options = ["C. 30", "A. 10", "D. 40", "B. 20"]
  correctOption = 0
```

### Implementasi

```typescript
function shuffleOptions(question: Question): Question {
  if (question.questionType !== "MULTIPLE_CHOICE") return question;

  const options = question.options as string[];
  const correctOption = question.correctOption ?? -1;

  const mapping = options.map((text, originalIndex) => ({
    text,
    originalIndex,
  }));

  const shuffled = shuffleArray(mapping);

  const newOptions = shuffled.map(item => item.text);
  const newCorrectOption = shuffled.findIndex(
    item => item.originalIndex === correctOption
  );

  return {
    ...question,
    options: newOptions,
    correctOption: newCorrectOption,
  };
}
```

## 4. Algoritma Grading per Tipe Soal

### MULTIPLE_CHOICE

```
Input: userAnswer = "2" (string, index pilihan yang dipilih)
       question.correctOption = 0 (int, index jawaban benar)

Algorithm:
  parsedAnswer = parseInt(userAnswer, 10)
  isCorrect = (parsedAnswer === question.correctOption)

Output: isCorrect = false (2 !== 0)
```

### SHORT_ANSWER

```
Input: userAnswer = "  Jakarta  "
       acceptableAnswers = ["Jakarta", "jakarta", "DKI Jakarta"]

Algorithm:
  normalized = userAnswer.trim().toLowerCase()  // "jakarta"
  
  for each answer in acceptableAnswers:
    normalizedAnswer = answer.trim().toLowerCase()
    if normalized === normalizedAnswer:
      isCorrect = true
      break

Output: isCorrect = true (match "jakarta")
```

### ESSAY (Number)

```
Input: userAnswer = "3,14"
       acceptableAnswers = ["3.14", "3,14"]

Algorithm:
  // Normalize: replace comma with dot for decimal
  normalized = userAnswer.replace(",", ".")  // "3.14"
  parsedUser = parseFloat(normalized)         // 3.14

  for each answer in acceptableAnswers:
    normalizedAnswer = answer.replace(",", ".")
    parsedAnswer = parseFloat(normalizedAnswer)
    
    if parsedUser === parsedAnswer:
      isCorrect = true
      break

Output: isCorrect = true (3.14 === 3.14)
```

## 5. State Management (Zustand)

### Store Shape

```typescript
interface StudyStore {
  // State
  questions: Question[];           // Semua soal yang sudah di-fetch
  currentIndex: number;           // Index soal yang sedang ditampilkan
  selectedAnswer: string | null;  // Jawaban yang sedang dipilih (belum submit)
  results: StudyResult[];         // Hasil grading per soal
  isAnswered: boolean;            // Apakah soal saat ini sudah dijawab
  isSubmitting: boolean;          // Loading state saat grading

  // Actions
  setQuestions: (questions: Question[]) => void;
  setSelectedAnswer: (answer: string | null) => void;
  submitAnswer: (result: StudyResult) => void;
  nextQuestion: () => void;
  reset: () => void;
}

interface StudyResult {
  questionId: number;
  userAnswer: string;
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}
```

### State Transitions

```
INITIAL
  │ setQuestions()
  ▼
QUESTION_DISPLAYED (currentIndex=0, selectedAnswer=null, isAnswered=false)
  │ user select answer → setSelectedAnswer()
  ▼
ANSWER_SELECTED (selectedAnswer="2", isAnswered=false)
  │ user click "Submit" → submitAnswer()
  ▼
ANSWERED (isAnswered=true, results=[...])
  │ user click "Next" → nextQuestion()
  ▼
QUESTION_DISPLAYED (currentIndex=1, selectedAnswer=null, isAnswered=false)
  │
  ...
  │ user click "Selesai" (last question)
  ▼
COMPLETED → show summary
```

## 6. Data Flow Detail

```
[Filter Form] ──submit──→ [Server Component / API]
                                │
                                ▼
                          [study-service.ts]
                                │ 1. prisma.question.findMany({ where: filter })
                                │ 2. shuffleArray(questions)
                                │ 3. shuffleOptions per question
                                │ 4. return questions[]
                                ▼
                          [Zustand] → store.setQuestions()
                                │
                                ▼
                          [QuestionCard] → render soal currentIndex
                                │
                                ▼
                          [AnswerInput] → user selects/types
                                │
                                ▼
                          [Submit] → POST /api/study/attempt
                                │
                                ▼
                          [study-service.ts]
                                │ 1. Fetch question by ID
                                │ 2. Grade based on questionType
                                │ 3. Save StudyAttempt
                                │ 4. Update StreakLog + User.streak
                                │ 5. Return result
                                ▼
                          [Zustand] → store.submitAnswer(result)
                                │
                                ▼
                          [FeedbackPanel] → render feedback
                                │
                                ▼
                          [Next] → store.nextQuestion()
                                │
                                ▼
                          [QuestionCard] → render soal currentIndex+1
```
