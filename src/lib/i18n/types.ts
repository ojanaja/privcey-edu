export type Locale = 'en' | 'id';

export interface Translations {
    common: {
        appName: string;
        loading: string;
        save: string;
        cancel: string;
        delete: string;
        edit: string;
        back: string;
        search: string;
        active: string;
        inactive: string;
        off: string;
        submit: string;
        close: string;
        all: string;
        actions: string;
        status: string;
        name: string;
        email: string;
        password: string;
        title: string;
        description: string;
        subject: string;
        duration: string;
        date: string;
        time: string;
        class: string;
        role: string;
        detail: string;
        noData: string;
        confirm: string;
        yes: string;
        no: string;
        minutes: string;
        min: string;
        points: string;
        general: string;
        exportCsv: string;
        previous: string;
        next: string;
        student: string;
        tutor: string;
        admin: string;
        selectSubject: string;
        allClasses: string;
        today: string;
        upcoming: string;
        finished: string;
        live: string;
        correct: string;
        incorrect: string;
        unanswered: string;
        score: string;
        total: string;
        average: string;
        type: string;
        pending: string;
        expired: string;
        answered: string;
        notYet: string;
        flagged: string;
    };

    landing: {
        login: string;
        register: string;
        premiumPlatform: string;
        heroTitle1: string;
        heroTitle2: string;
        heroDescription: string;
        startNow: string;
        haveAccount: string;
        activeStudents: string;
        classes: string;
        questionBank: string;
        satisfaction: string;
        featuresTitle: string;
        featuresHighlight: string;
        featuresDescription: string;
        readyToJoin: string;
        joinDescription: string;
        registerFree: string;
        copyright: string;
        features: {
            tryout: { title: string; description: string };
            vod: { title: string; description: string };
            emod: { title: string; description: string };
            scoreTracker: { title: string; description: string };
            strengthens: { title: string; description: string };
            leaderboard: { title: string; description: string };
        };
    };

    auth: {
        login: {
            title: string;
            subtitle: string;
            continueWithGoogle: string;
            disclaimer: string;
            googleError: string;
            authError: string;
        };
        staffLogin: {
            title: string;
            subtitle: string;
            emailPlaceholder: string;
            passwordPlaceholder: string;
            loginButton: string;
            isStudent: string;
            loginWithGoogle: string;
            wrongCredentials: string;
            accessDenied: string;
        };
    };

    nav: {
        dashboard: string;
        tryout: string;
        dailyExercise: string;
        emod: string;
        videoLearning: string;
        liveClass: string;
        myScores: string;
        leaderboard: string;
        strengthens: string;
        overview: string;
        users: string;
        students: string;
        questionBank: string;
        content: string;
        attendance: string;
        announcements: string;
        analytics: string;
        classes: string;
        studentScores: string;
        logout: string;
        adminPanel: string;
        tutorPanel: string;
        studentPortal: string;
    };

    theme: {
        lightMode: string;
        darkMode: string;
    };

    studentDashboard: {
        welcome: string;
        accountActive: string;
        renewPayment: string;
        totalTryout: string;
        avgScore: string;
        bestScore: string;
        subjects: string;
        recentScores: string;
        viewAll: string;
        noScoresYet: string;
        avgPerformance: string;
        excellent: string;
        good: string;
        keepLearning: string;
        upcomingTryouts: string;
        noSchedule: string;
        quickActions: string;
        doTryout: string;
        dailyExercise: string;
    };

    adminDashboard: {
        title: string;
        subtitle: string;
        totalStudents: string;
        activeStudents: string;
        overduePayments: string;
        totalTryouts: string;
        classDistribution: string;
        paymentStatus: string;
    };

    adminAnalytics: {
        title: string;
        subtitle: string;
        avgPerSubject: string;
        correctnessRate: string;
        topStudents: string;
        rank: string;
        easy: string;
        medium: string;
        hard: string;
    };

    adminClasses: {
        title: string;
        subtitle: string;
        studentsCapacity: string;
        create: string;
        newClass: string;
        editClass: string;
        nameLabel: string;
        namePlaceholder: string;
        descriptionLabel: string;
        descriptionPlaceholder: string;
        maxStudentsLabel: string;
        tutorLabel: string;
        noTutor: string;
        full: string;
        available: string;
        noClasses: string;
        confirmDelete: string;
        cannotDeleteWithStudents: string;
    };

    adminAnnouncements: {
        title: string;
        subtitle: string;
        create: string;
        newAnnouncement: string;
        titleLabel: string;
        titlePlaceholder: string;
        typeLabel: string;
        typeInfo: string;
        typeWarning: string;
        typeSuccess: string;
        typeUrgent: string;
        targetClass: string;
        contentLabel: string;
        contentPlaceholder: string;
        publish: string;
        confirmDelete: string;
        noAnnouncements: string;
    };

    adminAttendance: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        allActivities: string;
        video: string;
        liveClass: string;
        tryout: string;
        emod: string;
        noData: string;
        csvHeaders: {
            studentName: string;
            email: string;
            activity: string;
            title: string;
            time: string;
        };
    };

    adminContent: {
        title: string;
        subtitle: string;
        tabs: {
            vod: string;
            emod: string;
            liveClass: string;
        };
        addVideo: string;
        newVideo: string;
        youtubeUrl: string;
        durationLabel: string;
        confirmDeleteVideo: string;
        noVideos: string;
        addModule: string;
        newModule: string;
        driveUrl: string;
        chapter: string;
        chapterPlaceholder: string;
        confirmDeleteModule: string;
        noModules: string;
        scheduleLive: string;
        newLiveClass: string;
        meetLink: string;
        schedule: string;
        confirmDeleteLive: string;
        noLiveClasses: string;
    };

    adminQuestions: {
        title: string;
        subtitle: string;
        selectTryout: string;
        selectTryoutDefault: string;
        questionsCount: string;
        addQuestion: string;
        editQuestion: string;
        newQuestion: string;
        questionLabel: string;
        questionPlaceholder: string;
        optionLabel: string;
        optionOptional: string;
        optionPlaceholder: string;
        correctAnswer: string;
        difficulty: string;
        explanation: string;
        explanationPlaceholder: string;
        updateQuestion: string;
        saveQuestion: string;
        answerLabel: string;
        confirmDelete: string;
        noQuestions: string;
    };

    adminStudents: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        allStatus: string;
        payment: string;
        registeredDate: string;
        togglePayment: string;
        noStudents: string;
        csvHeaders: {
            name: string;
            email: string;
            class: string;
            paymentStatus: string;
            registeredDate: string;
        };
    };

    adminTryouts: {
        title: string;
        subtitle: string;
        create: string;
        editTryout: string;
        newTryout: string;
        titlePlaceholder: string;
        subjectLabel: string;
        classOptional: string;
        durationMinutes: string;
        passingGrade: string;
        descriptionPlaceholder: string;
        update: string;
        confirmDelete: string;
        activate: string;
        deactivate: string;
        noTryouts: string;
    };

    adminUsers: {
        title: string;
        subtitle: string;
        addStaff: string;
        allRoles: string;
        infoTitle: string;
        infoText1: string;
        infoText2: string;
        userColumn: string;
        registered: string;
        editUser: string;
        accountActive: string;
        paymentStatus: string;
        saveChanges: string;
        noClass: string;
        noUsers: string;
        newStaff: string;
        fullName: string;
        fullNamePlaceholder: string;
        emailPlaceholder: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        passwordMinLength: string;
        createStaffAccount: string;
        staffLoginInfo: string;
    };

    emod: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        openModule: string;
        noModules: string;
    };

    latsol: {
        title: string;
        subtitle: string;
        doExercise: string;
        noExercises: string;
        noExercisesDesc: string;
        noQuestions: string;
        noQuestionsDesc: string;
        exerciseComplete: string;
        correctOf: string;
        discussionLabel: string;
        backToList: string;
        questionOf: string;
        finishAndView: string;
        navigation: string;
        reasonLabel: string;
        reasonPlaceholder: string;
        reasonRequired: string;
        yourReason: string;
        fullyAnswered: string;
        needsReason: string;
        checkAnswer: string;
        answerCorrect: string;
        answerWrong: string;
        correctAnswerIs: string;
        nextQuestion: string;
        inProgress: string;
    };

    leaderboardPage: {
        title: string;
        fullRanking: string;
        you: string;
        tryoutCount: string;
        noData: string;
    };

    liveClassPage: {
        title: string;
        subtitle: string;
        upcoming: string;
        past: string;
        joinNow: string;
        openLink: string;
        noSchedule: string;
        noScheduleDesc: string;
        timezone: string;
    };

    paymentRequired: {
        title: string;
        description: string;
        contactAdmin: string;
        backToDashboard: string;
        whatsappMessage: string;
    };

    scoresPage: {
        title: string;
        avgLabel: string;
        bestLabel: string;
        totalLabel: string;
        trendLabel: string;
        trendline: string;
        scoreHistory: string;
        tryoutColumn: string;
        subjectColumn: string;
        correctColumn: string;
        wrongColumn: string;
        emptyColumn: string;
        scoreColumn: string;
        dateColumn: string;
        noHistory: string;
    };

    strengthensPage: {
        title: string;
        subtitle: string;
        howToPlay: string;
        howToPlayDesc: string;
        best: string;
        modulesPlayed: string;
        noQuizGames: string;
        noQuizGamesDesc: string;
        preparingQuiz: string;
        loadingQuestions: string;
    };

    tryoutList: {
        title: string;
        subtitle: string;
        filterAll: string;
        filterActive: string;
        filterCompleted: string;
        passingGrade: string;
        startTime: string;
        doTryout: string;
        noTryouts: string;
        noTryoutsDesc: string;
    };

    tryoutDetail: {
        notFound: string;
        backToList: string;
        questionsCount: string;
        durationLabel: string;
        passingGrade: string;
        totalQuestions: string;
        done: string;
        notDone: string;
        attempted: string;
        retake: string;
        startExam: string;
        noQuestions: string;
        previousResults: string;
        finishedAt: string;
        strengthensAvailable: string;
        openStrengthens: string;
        neverAttempted: string;
        clickStartExam: string;
    };

    tutorDashboard: {
        hello: string;
        subtitle: string;
        myTryouts: string;
        totalAttempts: string;
        questionBank: string;
        recentAttempts: string;
        noAttempts: string;
    };

    tutorAttendance: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        noData: string;
    };

    tutorScores: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
        passed: string;
        failed: string;
        noData: string;
    };

    tutorTryouts: {
        title: string;
        subtitle: string;
        create: string;
        newTryout: string;
        selectSubject: string;
        classOptional: string;
        allOption: string;
        durationMinutes: string;
        questionsSection: string;
        addQuestion: string;
        questionPlaceholder: string;
        answerLabel: string;
        confirmDeleteQuestion: string;
    };

    vod: {
        subtitle: string;
        searchPlaceholder: string;
        noVideos: string;
    };

    exam: {
        readyTitle: string;
        questionsCount: string;
        durationLabel: string;
        startExam: string;
        examDone: string;
        answersCollected: string;
        answeredCount: string;
        emptyCount: string;
        backToTryoutList: string;
        questionProgress: string;
        submitButton: string;
        questionImage: string;
        prevButton: string;
        flagged: string;
        flag: string;
        nextButton: string;
        questionNav: string;
        submitConfirmTitle: string;
        submitConfirmAnswered: string;
        submitConfirmUnanswered: string;
        submitConfirmTime: string;
        yesSubmit: string;
    };

    quizGame: {
        go: string;
        streak: string;
        correctFeedback: string;
        incorrectFeedback: string;
        correctAnswerIs: string;
        explanationLabel: string;
        continueButton: string;
        rankMaster: string;
        rankGreat: string;
        rankGood: string;
        rankKeepGoing: string;
        totalScore: string;
        accuracy: string;
        correctLabel: string;
        bestStreak: string;
        avgTime: string;
        reviewAnswers: string;
        correctTooltip: string;
        unansweredTooltip: string;
        incorrectTooltip: string;
        playAgain: string;
        backButton: string;
    };

    payment: {
        title: string;
        subtitle: string;
        monthlyFee: string;
        benefit1: string;
        benefit2: string;
        benefit3: string;
        benefit4: string;
        secureNote: string;
        payWithQris: string;
        generatingQris: string;
        scanQris: string;
        scanQrisDesc: string;
        totalPayment: string;
        remaining: string;
        waitingPayment: string;
        supportedApps: string;
        payLater: string;
        successTitle: string;
        successDesc: string;
        startLearning: string;
        expiredTitle: string;
        expiredDesc: string;
        tryAgain: string;
        errorTitle: string;
        errorDesc: string;
        backToDashboard: string;
        alreadyActive: string;
        alreadyActiveDesc: string;
        dashboardBanner: string;
        dashboardBannerDesc: string;
        payNow: string;
    };

    ui: {
        scoreRingLabel: string;
    };
}
