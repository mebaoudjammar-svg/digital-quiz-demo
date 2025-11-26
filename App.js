import React, { useState, useEffect, useMemo, useCallback } from 'react';
// تم إزالة جميع استدعاءات Firebase (initializeApp, getFirestore, onSnapshot, إلخ)
// ملاحظة: تم حذف جميع الأجزاء المتعلقة بـ Firebase لتشغيل الـ Demo محلياً.

// بيانات الأسئلة الثابتة
const quizQuestions = [
    {
        question: "ما هو المصطلح الذي يصف عملية الظهور في نتائج محركات البحث بدون دفع أي إعلان؟",
        options: ["إعلانات محركات البحث (SEA)", "التحسين العضوي (SEO)", "التسويق عبر البريد الإلكتروني"],
        correctIndex: 1,
    },
    {
        question: "أي مرحلة من رحلة العميل تهدف إلى بناء الوعي للجمهور 'البارد' (الذي لا يعرف المنتج بعد)؟",
        options: ["مرحلة التحويل (Conversion)", "مرحلة الوعي (Awareness)", "مرحلة الولاء (Loyalty)"],
        correctIndex: 1,
    },
];

const TIME_LIMIT_SECONDS = 10;

// ******************************************************
// مكون المشاركين (Participant) - مُعدل ليعمل بدون Firebase
// ******************************************************
const ParticipantView = ({ quizState, setQuizState, participant, setParticipant, currentQuestion, userId }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [message, setMessage] = useState('');
    const [timeLeftDisplay, setTimeLeftDisplay] = useState(TIME_LIMIT_SECONDS); 
    const [isSubmitting, setIsSubmitting] = useState(false);

    const questionIndex = quizState?.currentQuestionIndex || 0;
    const isAnswered = participant?.lastAnswerIndex === questionIndex;
    const isFinished = questionIndex >= quizQuestions.length;
    
    // محاكاة المؤقت
    useEffect(() => {
        if (isFinished || questionIndex === -1 || !quizState.isActive) {
            setTimeLeftDisplay(TIME_LIMIT_SECONDS);
            return;
        }

        const interval = setInterval(() => {
            setTimeLeftDisplay(prev => {
                if (prev <= 0.1) {
                    clearInterval(interval);
                    return 0;
                }
                return prev - 0.1;
            });
        }, 100); 
        
        return () => clearInterval(interval);
    }, [isFinished, questionIndex, quizState.isActive]);


    const submitAnswer = useCallback((optionIndex) => {
        if (isSubmitting || isAnswered || isFinished || timeLeftDisplay <= 0) return;

        setIsSubmitting(true);
        setSelectedOption(optionIndex); 
        const isCorrect = optionIndex === currentQuestion.correctIndex;
        
        // تحديث حالة المشارك محلياً
        setParticipant(prev => {
            const newScore = (prev.score || 0) + (isCorrect ? 1 : 0);
            return {
                ...prev,
                score: newScore,
                lastAnswerIndex: questionIndex,
                lastAnswerTime: Date.now(),
            };
        });

        setMessage(isCorrect ? "✅ إجابة صحيحة! ننتظر السؤال التالي..." : "❌ إجابة خاطئة. ننتظر السؤال التالي...");
        setTimeout(() => setIsSubmitting(false), 500); 
        
    }, [questionIndex, isSubmitting, isAnswered, isFinished, currentQuestion, timeLeftDisplay, setParticipant]);
    
    // شاشة إدخال الاسم
    if (!participant || !participant.name) {
        const [tempName, setTempName] = useState('');
        
        const registerParticipant = () => {
            if (tempName.trim().length < 2) return;
            setParticipant({
                name: tempName.trim(),
                score: 0,
                lastAnswerIndex: -1,
                isTrainer: false,
                joinTime: Date.now(),
                userId: userId
            });
        };

        return (
            <div className="bg-white p-8 rounded-xl shadow-lg mt-8 text-center max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-indigo-700 mb-4">أهلاً بك في التحدي!</h3>
                <p className="text-gray-600 mb-6">الرجاء إدخال اسمك للمشاركة في الاختبار.</p>
                <input
                    type="text"
                    placeholder="اسم المشارك"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    className="w-full p-3 mb-4 border border-gray-300 rounded-lg text-right"
                />
                <button
                    onClick={registerParticipant}
                    className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition duration-300 disabled:opacity-50"
                    disabled={tempName.trim().length < 2}
                >
                    ابدأ التحدي
                </button>
            </div>
        );
    }

    if (quizState?.currentQuestionIndex === -1) {
         return (
            <div className="bg-white p-8 rounded-xl shadow-lg mt-8 text-center max-w-md mx-auto">
                <h3 className="text-2xl font-bold text-indigo-700 mb-4">بانتظار المدرب لبدء الاختبار...</h3>
                <p className="text-gray-600">سيظهر السؤال الأول هنا تلقائياً.</p>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="bg-white p-8 rounded-xl shadow-lg mt-8 text-center max-w-md mx-auto">
                <h3 className="text-3xl font-bold text-green-700 mb-4">🎉 انتهى الاختبار! 🎉</h3>
                <p className="text-xl text-gray-700">لقد أكملت جميع الأسئلة يا {participant.name}.</p>
                <p className="text-4xl font-extrabold text-indigo-600 mt-4">نقاطك: {participant.score} / {quizQuestions.length}</p>
            </div>
        );
    }
    
    const timerPercentage = (timeLeftDisplay / TIME_LIMIT_SECONDS) * 100;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg mt-8 max-w-md mx-auto">
             <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                السؤال {questionIndex + 1} من {quizQuestions.length}
            </h3>
            
            <div className="h-4 bg-gray-200 rounded-full mb-6 relative overflow-hidden">
                <div 
                    style={{ width: `${timerPercentage}%` }}
                    className={`h-4 rounded-full transition-all duration-100 ease-linear 
                        ${timerPercentage > 30 ? 'bg-indigo-500' : 'bg-red-500'}`}
                ></div>
                <span className="absolute inset-0 text-center text-xs font-bold text-white leading-4">
                    {Math.ceil(timeLeftDisplay)} ثوانٍ متبقية
                </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-700 mb-6 text-right">{currentQuestion.question}</h2>
            
            {message && (
                <div className={`p-3 mb-4 rounded-lg font-bold text-center ${message.startsWith('✅') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {message}
                </div>
            )}
            
            <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                    <button
                        key={index}
                        onClick={() => submitAnswer(index)}
                        disabled={isAnswered || isSubmitting || isFinished || timeLeftDisplay <= 0}
                        className={`w-full text-right p-4 rounded-lg font-medium transition duration-200 shadow-sm border 
                            ${(isAnswered && index === currentQuestion.correctIndex) ? 'bg-green-100 border-green-500' : ''}
                            ${(isAnswered && index !== currentQuestion.correctIndex && index === selectedOption) ? 'bg-red-100 border-red-500' : ''}
                            ${isAnswered || timeLeftDisplay <= 0 ? 'bg-gray-200 cursor-not-allowed' : 'bg-gray-50 hover:bg-indigo-50 border-gray-200'}`}
                    >
                        {option}
                        {isSubmitting && index === selectedOption && (
                            <span className="mr-2">...</span> 
                        )}
                    </button>
                ))}
            </div>

            <div className="mt-6 text-center text-sm text-gray-500 border-t pt-4">
                <p>
                    {isFinished ? 'انتهى.' : isAnswered ? 'تم تسجيل إجابتك.' : 'الرجاء اختيار الإجابة.'}
                </p>
                <p className="mt-2 text-xs">نقاطك الحالية: {participant.score}</p>
            </div>
        </div>
    );
};

export default function App() {
    const [userId, setUserId] = useState(Date.now());
    const [viewMode, setViewMode] = useState(null); 
    const [quizState, setQuizState] = useState({ currentQuestionIndex: -1, isActive: false, startTime: null });
    const [participants, setParticipants] = useState([]);
    const [participant, setParticipant] = useState(null);

    useEffect(() => {
        if (participant && viewMode === 'Participant' && participant.name) {
            setParticipants(prev => {
                const existing = prev.find(p => p.userId === userId);
                if (existing) {
                    return prev.map(p => p.userId === userId ? { ...p, ...participant } : p);
                }
                return [...prev, participant];
            });
        }
    }, [participant, userId, viewMode]);

    const contentToRender = useMemo(() => {
        if (!viewMode) {
            return <div>اختر وضعك</div>;
        }
        return <ParticipantView quizState={quizState} setQuizState={setQuizState} participant={participant} setParticipant={setParticipant} currentQuestion={quizQuestions[quizState.currentQuestionIndex]} userId={userId} />;
    }, [viewMode, quizState, participant, userId]);

    return <div>{contentToRender}</div>;
}