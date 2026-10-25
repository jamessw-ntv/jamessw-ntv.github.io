/* ============================================================
   QUIZ SETTINGS AND QUESTIONS. This is the only file you need to edit.
   ------------------------------------------------------------
   - Paste your Cloudflare Worker URL into WORKER_URL (see SETUP.md).
   - Each question has: q (the question), options (the choices),
     and answer (the number of the correct option, counting from 0).
     So answer: 0 = first option, answer: 1 = second option, and so on.
   - Keep the commas and quotes exactly as shown.
   ============================================================ */

const QUIZ = {
  title: "WBSC Umpire Mechanics: Knowledge Check",
  passMark: 80, // percent needed to pass

  // Paste your Worker URL here, inside the quotes (it ends in .workers.dev).
  WORKER_URL: "PASTE_YOUR_WORKER_URL_HERE",

  // PLACEHOLDER QUESTIONS: replace with the real ones before going live.
  questions: [
    {
      q: "In a two-umpire system with no runners on base, where does the base umpire start?",
      options: [
        "Behind the pitcher's plate",
        "Outside the first base line, behind the first baseman",
        "Between second and third base",
        "In foul territory near home plate"
      ],
      answer: 1
    },
    {
      q: "What is the plate umpire's signal for a strike?",
      options: [
        "Both arms extended sideways",
        "Right arm raised or a punch-out motion with the right hand",
        "Pointing at the batter",
        "Left arm raised"
      ],
      answer: 1
    },
    {
      q: "On a fly ball to the outfield with no runners on, who usually has the catch / no catch call in a two-umpire system?",
      options: [
        "Always the plate umpire",
        "Always the base umpire",
        "The base umpire if they go out, otherwise the plate umpire",
        "Whoever is closest to the dugout"
      ],
      answer: 2
    },
    {
      q: "How does an umpire signal 'safe'?",
      options: [
        "Both arms swept out to the sides, palms down",
        "A clenched fist raised",
        "Pointing at the base",
        "Arms crossed over the chest"
      ],
      answer: 0
    },
    {
      q: "Before calling a play at a base, the umpire should first:",
      options: [
        "Signal immediately as the runner arrives",
        "Look at the coach for confirmation",
        "Get set, see the whole play, pause, then signal",
        "Wait for the fielder to appeal"
      ],
      answer: 2
    }
  ]
};
