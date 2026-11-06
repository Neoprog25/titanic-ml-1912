/**
 * R.M.S. TITANIC — 1912 CINEMATIC MULTI-STEP WIZARD
 * Lead UI/UX Architect Edition:
 * - "Zero-Black-Screen" Crossfade Engine (playing-event based, non-destructive)
 * - Progressive Step-by-Step Video Preloading (link prefetch)
 * - Full Two-Way Reactive Binding (Travel Class <-> Ticket Fare Slider)
 * - Strict Reactive Passenger & Family Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. DOM ELEMENTLAR VA HOLAT O'ZGARUVCHILARI
    // -------------------------------------------------------------
    let currentVideo = document.getElementById('videoA');
    let nextVideo = document.getElementById('videoB');
    const videoPoster = document.getElementById('videoPoster');
    const sceneLabel = document.getElementById('sceneLabel');

    if (currentVideo) {
        currentVideo.muted = true;
        currentVideo.play().catch(err => console.warn("Autoplay kutmoqda:", err));
    }

    let currentStep = 0;
    const totalSteps = 5;

    const wizardSteps = [
        document.getElementById('step0'),
        document.getElementById('step1'),
        document.getElementById('step2'),
        document.getElementById('step3'),
        document.getElementById('step4'),
        document.getElementById('step5')
    ];

    const stepDots = document.querySelectorAll('.step-dot');

    const pName = document.getElementById('pName');
    const pTitle = document.getElementById('pTitle');
    const pSex = document.getElementById('pSex');
    const pAge = document.getElementById('pAge');
    const pAgeVal = document.getElementById('pAgeVal');
    const pFare = document.getElementById('pFare');
    const pFareVal = document.getElementById('pFareVal');
    const pSibsp = document.getElementById('pSibsp');
    const pParch = document.getElementById('pParch');
    const pEmbarked = document.getElementById('pEmbarked');
    const classOptions = document.querySelectorAll('.class-option');
    const familyStatusBadge = document.getElementById('familyStatusBadge');

    let selectedClass = 3;
    let isSyncing = false;

    // -------------------------------------------------------------
    // 2. VIDEO SAHNALAR TAVSIFI VA ZERO-BLACK-SCREEN CROSSFADE
    // -------------------------------------------------------------
    const sceneDescriptions = {
        'intro.mp4': "Sautgempton porti (R.M.S. Titanic)",
        'passenger_boy.mp4': "Yosh o'g'il bola (Gazetachi bola)",
        'passenger_girl.mp4': "Yosh qiz bola (Titanic palubasida)",
        'passenger_man.mp4': "O'rta yoshli erkak yo'lovchi",
        'passenger_woman.mp4': "O'rta yoshli ayol yo'lovchi",
        'passenger_elder_man.mp4': "Keksa janob (Kresloda o'tirgan bobo)",
        'passenger_elder_woman.mp4': "Keksa xonim (Titanic palubasidagi buvi)",
        'elder_couple.mp4': "Keksa juftlik (Bobo va buvi birga)",
        'elder_man_family.mp4': "Keksa bobo (Oilasi va nevaralari bilan)",
        'elder_woman_family.mp4': "Keksa buvi (Oilasi va nevaralari bilan)",
        'couple.mp4': "Yosh juftlik (Edwardian er-xotin)",
        'family.mp4': "Umumiy oila va bolalar choyxo'rligi",
        'alone.mp4': "Yolg'iz yo'lovchi (Kema panjarasida)",
        'class1.mp4': "1-klass: Hashamatli Grand Staircase zali",
        'class2.mp4': "2-klass: O'rta toifa kutubxonasi",
        'class3.mp4': "3-klass: Quyi tor Steerage yo'lagi",
        'boarding.mp4': "Bortga chiqish (Kemaga ko'tarilish trapi)",
        'fate.mp4': "Muzdek Shimoliy Atlantika okeani (15-aprel, 1912)"
    };

    /**
     * Sahnaning poster rasmini bir lahzada (0.05s) o'rnatish:
     * Video yuklanguncha qora ekran chiqishini 100% yo'qotadi.
     */
    function setScenePoster(sceneNameOrPath) {
        if (!videoPoster) return;
        let base = sceneNameOrPath.split('/').pop().replace(/\.mp4$/, '').replace(/\.webp$/, '');
        videoPoster.style.backgroundImage = `url('/static/images/posters/${base}.webp')`;
    }

    /**
     * "Zero-Black-Screen" Instant Poster-to-Motion Crossfade:
     * 1. Tugma bosilishi bilan poster darhol qo'yiladi.
     * 2. Yangi video 'playing' kadr berishni boshlaguncha eski video to'xtamaydi.
     */
    function smoothPlayVideo(newSrc) {
        if (!currentVideo || !nextVideo) return;

        let targetPath = newSrc;
        if (!targetPath.startsWith('/static/videos/')) {
            targetPath = `/static/videos/${newSrc}`;
        }
        if (!targetPath.endsWith('.mp4')) {
            targetPath += '.mp4';
        }

        const filename = targetPath.split('/').pop();
        const baseName = filename.replace('.mp4', '');

        // 1. DASTLAB o'sha sahnaning posterini bir zumda qo'yamiz (Instant Poster-to-Motion)
        setScenePoster(baseName);

        // Sahna tavsif matnini darhol yangilaymiz
        if (sceneLabel && sceneDescriptions[filename]) {
            sceneLabel.textContent = sceneDescriptions[filename];
            sceneLabel.style.opacity = '1';
        }

        // Agar ayni paytda o'ynayotgan video bilan bir xil bo'lsa, qayta yuklamaymiz
        if (currentVideo.getAttribute('src') === targetPath || (currentVideo.currentSrc && currentVideo.currentSrc.endsWith(targetPath))) {
            return;
        }

        // 2. Yangi manbani orqada turgan (nextVideo) tegga yuklaymiz
        nextVideo.src = targetPath;
        nextVideo.muted = true;
        nextVideo.load();

        // 3. Yangi video amalda o'ynab ketmaguncha ESKI VIDEONI ASLO O'CHIRMAYMIZ!
        const onPlaying = () => {
            // Faqatgina yangi video kadr berishni boshlaganda crossfade qilamiz
            nextVideo.classList.add('active-video');
            nextVideo.classList.remove('next-video');

            currentVideo.classList.remove('active-video');
            currentVideo.classList.add('next-video');

            // 0.8 soniyadan keyin eski videoni to'xtatamiz va o'rinlarni almashtiramiz
            setTimeout(() => {
                currentVideo.pause();
                const temp = currentVideo;
                currentVideo = nextVideo;
                nextVideo = temp;
            }, 800);

            nextVideo.removeEventListener('playing', onPlaying);
        };

        nextVideo.addEventListener('playing', onPlaying);
        nextVideo.play().catch(e => console.warn("Video play buffering:", e));
    }

    // crossFadeToVideo funksiyasi uchun xavfsiz alias
    const crossFadeToVideo = smoothPlayVideo;

    // -------------------------------------------------------------
    // 3. AQLLI BOSQICHMA-BOSQICH KESH (PROGRESSIVE PRELOADING)
    // -------------------------------------------------------------
    const preloadedUrls = new Set();
    function preloadVideos(videoUrlList) {
        if (!videoUrlList || !Array.isArray(videoUrlList)) return;
        videoUrlList.forEach(url => {
            let base = url.split('/').pop().replace('.mp4', '').replace('.webp', '');
            
            // Poster prefetch
            const posterUrl = `/static/images/posters/${base}.webp`;
            if (!preloadedUrls.has(posterUrl)) {
                preloadedUrls.add(posterUrl);
                const imgLink = document.createElement('link');
                imgLink.rel = 'prefetch';
                imgLink.as = 'image';
                imgLink.href = posterUrl;
                document.head.appendChild(imgLink);
            }

            // Video prefetch
            const videoUrl = `/static/videos/${base}.mp4`;
            if (!preloadedUrls.has(videoUrl)) {
                preloadedUrls.add(videoUrl);
                const vidLink = document.createElement('link');
                vidLink.rel = 'prefetch';
                vidLink.as = 'video';
                vidLink.href = videoUrl;
                document.head.appendChild(vidLink);
            }
        });
    }

    // -------------------------------------------------------------
    // 4. YO'LOVCHI VA OILA VIDEO MANTIQI (1 va 3-BOSQICHLAR)
    // -------------------------------------------------------------
    function getPassengerBaseVideo(gender, age) {
        const isMale = (gender === 'male' || gender === 'Erkak' || gender.toLowerCase().includes('erkak'));

        if (age < 14) {
            return isMale ? '/static/videos/passenger_boy.mp4' : '/static/videos/passenger_girl.mp4';
        } else if (age >= 55) {
            return isMale ? '/static/videos/passenger_elder_man.mp4' : '/static/videos/passenger_elder_woman.mp4';
        } else {
            return isMale ? '/static/videos/passenger_man.mp4' : '/static/videos/passenger_woman.mp4';
        }
    }

    function getFamilyStepVideo(gender, age, sibsp, parch) {
        const totalCompanions = sibsp + parch;
        const isElder = (age >= 55);
        const isMale = (gender === 'male' || gender === 'Erkak' || gender.toLowerCase().includes('erkak'));

        // QOIDA 1: Agar yolg'iz bo'lsa (0 hamroh), 1-bosqichdagi yo'lovchining aynan o'zi ko'rsatiladi
        if (totalCompanions === 0) {
            return getPassengerBaseVideo(gender, age);
        }

        // QOIDA 2: Agar jami 1 ta hamroh bo'lsa (Juftlik)
        if (totalCompanions === 1) {
            if (isElder) {
                return '/static/videos/elder_couple.mp4';
            } else {
                return '/static/videos/couple.mp4';
            }
        }

        // QOIDA 3: Agar 1 tadan ko'p hamroh bo'lsa (Oila)
        if (totalCompanions > 1) {
            if (isElder) {
                return isMale 
                    ? '/static/videos/elder_man_family.mp4'
                    : '/static/videos/elder_woman_family.mp4';
            } else {
                return '/static/videos/family.mp4';
            }
        }
    }

    // -------------------------------------------------------------
    // 5. KLASS VA CHIPTA NARXI: IKKI TOMONLAMA SINXRONIZATSIYA (TWO-WAY BINDING)
    // -------------------------------------------------------------
    const classConfigs = {
        1: {
            name: "1-klass",
            min: 35.1,
            max: 512.0,
            default: 75.0,
            video: '/static/videos/class1.mp4',
            hint: "1-klass narx chegarasi: £35.1 — £512.0 (Standart: £75.0)"
        },
        2: {
            name: "2-klass",
            min: 15.0,
            max: 35.0,
            default: 25.0,
            video: '/static/videos/class2.mp4',
            hint: "2-klass narx chegarasi: £15.0 — £35.0 (Standart: £25.0)"
        },
        3: {
            name: "3-klass",
            min: 3.0,
            max: 15.0,
            default: 9.0,
            video: '/static/videos/class3.mp4',
            hint: "3-klass narx chegarasi: £3.0 — £15.0 (Standart: £9.0)"
        }
    };

    function determineClassFromFare(fare) {
        if (fare < 15.0) return 3;
        if (fare <= 35.0) return 2;
        return 1;
    }

    function getClassVideo() {
        if (selectedClass === 1) return '/static/videos/class1.mp4';
        if (selectedClass === 2) return '/static/videos/class2.mp4';
        return '/static/videos/class3.mp4';
    }

    function updateClassUI(targetClass, triggerVideo = true) {
        selectedClass = targetClass;

        // Kartochkalar faolligini va radio inputni sinxronlash
        classOptions.forEach(opt => {
            const optClass = parseInt(opt.getAttribute('data-pclass'));
            const radio = opt.querySelector('input[type="radio"]');
            if (optClass === targetClass) {
                opt.classList.add('active');
                if (radio) radio.checked = true;
            } else {
                opt.classList.remove('active');
                if (radio) radio.checked = false;
            }
        });

        // Hint matnini yangilash
        const hintEl = document.getElementById('fareLimitHint');
        if (hintEl && classConfigs[targetClass]) {
            hintEl.textContent = classConfigs[targetClass].hint;
        }

        // Yashirin form maydonini yangilash
        const hiddenPclass = document.getElementById('pclass');
        if (hiddenPclass) hiddenPclass.value = targetClass;

        // Agar 2-bosqichda bo'lsa, mos klass videosiga silliq o'tish
        if (triggerVideo && currentStep === 2) {
            smoothPlayVideo(classConfigs[targetClass].video);
        }
    }

    function handleClassCardClick(targetClass) {
        if (isSyncing) return;
        isSyncing = true;

        const config = classConfigs[targetClass];
        if (config) {
            // Slayder va ko'rsatkichni standart narxga o'tkazish
            pFare.value = config.default;
            pFareVal.textContent = `£ ${config.default.toFixed(1)}`;

            const hiddenFare = document.getElementById('fare');
            if (hiddenFare) hiddenFare.value = config.default;

            updateClassUI(targetClass, true);
        }

        isSyncing = false;
    }

    function handleFareSliderInput() {
        if (isSyncing) return;
        isSyncing = true;

        const fare = parseFloat(pFare.value) || 9.0;
        pFareVal.textContent = `£ ${fare.toFixed(1)}`;

        const hiddenFare = document.getElementById('fare');
        if (hiddenFare) hiddenFare.value = fare;

        const newClass = determineClassFromFare(fare);
        if (newClass !== selectedClass) {
            // Narx boshqa klass oralig'iga o'tganda kartochka va video avtomatik o'zgaradi
            updateClassUI(newClass, true);
        } else {
            const hiddenPclass = document.getElementById('pclass');
            if (hiddenPclass) hiddenPclass.value = selectedClass;
        }

        isSyncing = false;
    }

    // -------------------------------------------------------------
    // 6. WIZARD QADAMLARI VA BOSQICHMA-BOSQICH PRELOAD
    // -------------------------------------------------------------
    function updateVideoForCurrentStep() {
        const age = parseInt(pAge.value) || 28;
        const gender = pSex.value;
        const sibsp = parseInt(pSibsp.value) || 0;
        const parch = parseInt(pParch.value) || 0;

        switch (currentStep) {
            case 0:
                smoothPlayVideo('/static/videos/intro.mp4');
                break;
            case 1:
                smoothPlayVideo(getPassengerBaseVideo(gender, age));
                break;
            case 2:
                smoothPlayVideo(getClassVideo());
                break;
            case 3:
                smoothPlayVideo(getFamilyStepVideo(gender, age, sibsp, parch));
                break;
            case 4:
                smoothPlayVideo('/static/videos/boarding.mp4');
                updateSummaryDetails();
                break;
            case 5:
                smoothPlayVideo('/static/videos/fate.mp4');
                break;
        }
    }

    function goToStep(stepIndex) {
        if (stepIndex < 0 || stepIndex > totalSteps) return;

        wizardSteps.forEach((stepEl, idx) => {
            if (idx === stepIndex) {
                stepEl.classList.add('active');
            } else {
                stepEl.classList.remove('active');
            }
        });

        stepDots.forEach((dot, idx) => {
            if (idx === stepIndex) {
                dot.className = 'step-dot active';
            } else if (idx < stepIndex) {
                dot.className = 'step-dot completed';
            } else {
                dot.className = 'step-dot';
            }
        });

        currentStep = stepIndex;
        updateVideoForCurrentStep();

        // Progressive Step-by-Step Preloading
        switch (stepIndex) {
            case 0:
                // 0-qadamda: 1-qadam yo'lovchi videolari
                preloadVideos(['passenger_man.mp4', 'passenger_woman.mp4']);
                break;
            case 1:
                // 1-qadamda: 2-qadam klass videolari
                preloadVideos(['class1.mp4', 'class2.mp4', 'class3.mp4']);
                break;
            case 2:
                // 2-qadamda: 3-qadam oila/hamroh videolari
                preloadVideos(['alone.mp4', 'couple.mp4', 'family.mp4']);
                break;
            case 3:
                // 3-qadamda: 4-qadam va natija videolari
                preloadVideos(['boarding.mp4', 'fate.mp4']);
                break;
        }
    }

    // -------------------------------------------------------------
    // 7. HODISALAR (EVENT LISTENERS)
    // -------------------------------------------------------------
    // 1-bosqich: Yosh va Jins o'zgarishi
    function handlePassengerIdentityChange() {
        const age = parseInt(pAge.value) || 28;
        pAgeVal.textContent = `${age} yosh`;
        if (currentStep === 1) {
            smoothPlayVideo(getPassengerBaseVideo(pSex.value, age));
        }
    }

    pAge.addEventListener('input', handlePassengerIdentityChange);
    pSex.addEventListener('change', handlePassengerIdentityChange);

    pTitle.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'Mrs' || val === 'Miss') {
            pSex.value = 'female';
        } else if (val === 'Mr' || val === 'Master' || val === 'Lord') {
            pSex.value = 'male';
        }
        handlePassengerIdentityChange();
    });

    // 2-bosqich: Klass tanlash va Narx ikki tomonlama reaktivligi
    classOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const targetClass = parseInt(opt.getAttribute('data-pclass'));
            handleClassCardClick(targetClass);
        });
    });

    pFare.addEventListener('input', handleFareSliderInput);
    pFare.addEventListener('change', handleFareSliderInput);

    // 3-bosqich: Hamrohlar (SibSp va Parch)
    function handleFamilyInputChange() {
        const sibsp = parseInt(pSibsp.value) || 0;
        const parch = parseInt(pParch.value) || 0;
        const total = sibsp + parch + 1;
        const age = parseInt(pAge.value) || 28;
        const gender = pSex.value;

        if (sibsp === 0 && parch === 0) {
            familyStatusBadge.innerHTML = '<span>👤 Sayohat holati:</span> <strong>Yolg\'iz sayohatchi (1 kishi)</strong>';
        } else if (sibsp > 0 && parch === 0) {
            familyStatusBadge.innerHTML = `<span>👫 Sayohat holati:</span> <strong>Juftlik / Hamroh (${sibsp + 1} kishi)</strong>`;
        } else {
            familyStatusBadge.innerHTML = `<span>👨‍👩‍👧‍👦 Sayohat holati:</span> <strong>Oila va bolalar (${total} kishi)</strong>`;
        }

        if (currentStep === 3) {
            smoothPlayVideo(getFamilyStepVideo(gender, age, sibsp, parch));
        }
    }

    pSibsp.addEventListener('input', handleFamilyInputChange);
    pParch.addEventListener('input', handleFamilyInputChange);

    // 4-bosqich: Rezyumeni yangilash
    function updateSummaryDetails() {
        const sumName = document.getElementById('sumName');
        const sumClass = document.getElementById('sumClass');
        const sumFamily = document.getElementById('sumFamily');
        const sumPort = document.getElementById('sumPort');

        if (sumName) sumName.textContent = `${pName.value.trim()} (${pTitle.value})`;
        if (sumClass) sumClass.textContent = `${selectedClass}-klass (£${parseFloat(pFare.value).toFixed(1)})`;

        const sibsp = parseInt(pSibsp.value) || 0;
        const parch = parseInt(pParch.value) || 0;
        if (sumFamily) {
            if (sibsp === 0 && parch === 0) {
                sumFamily.textContent = "Yolg'iz (1 kishi)";
            } else if (sibsp > 0 && parch === 0) {
                sumFamily.textContent = `Juftlik / Hamroh (${sibsp + 1} kishi)`;
            } else {
                sumFamily.textContent = `Oila (${sibsp + parch + 1} kishi)`;
            }
        }

        const portMap = { 'S': 'Southampton', 'C': 'Cherbourg', 'Q': 'Queenstown' };
        if (sumPort) sumPort.textContent = portMap[pEmbarked.value] || pEmbarked.value;
    }

    // -------------------------------------------------------------
    // 8. NAVIGATION BUTTONS
    // -------------------------------------------------------------
    document.getElementById('btnStartWizard').addEventListener('click', () => goToStep(1));
    document.getElementById('btnBackTo0').addEventListener('click', () => goToStep(0));
    document.getElementById('btnToStep2').addEventListener('click', () => goToStep(2));
    document.getElementById('btnBackTo1').addEventListener('click', () => goToStep(1));
    document.getElementById('btnToStep3').addEventListener('click', () => goToStep(3));
    document.getElementById('btnBackTo2').addEventListener('click', () => goToStep(2));
    document.getElementById('btnToStep4').addEventListener('click', () => goToStep(4));
    document.getElementById('btnBackTo3').addEventListener('click', () => goToStep(3));

    document.getElementById('btnRestartWizard').addEventListener('click', () => {
        const stampSeal = document.getElementById('stampSealBadge');
        if (stampSeal) stampSeal.className = 'stamp-seal-badge';
        goToStep(0);
    });

    // -------------------------------------------------------------
    // 9. TAQDIRNI ANIQLASH (DETERMINE FATE) VA ML API
    // -------------------------------------------------------------
    const btnCalculateFate = document.getElementById('btnCalculateFate');
    const stampSealBadge = document.getElementById('stampSealBadge');
    const resStampText = document.getElementById('resStampText');
    const resProb = document.getElementById('resProb');
    const resProgressFill = document.getElementById('resProgressFill');
    const resVerdict = document.getElementById('resVerdict');
    const resFactor1 = document.getElementById('resFactor1');
    const resFactor2 = document.getElementById('resFactor2');

    btnCalculateFate.addEventListener('click', async () => {
        goToStep(5);
        btnCalculateFate.disabled = true;

        const payload = {
            name: pName.value.trim(),
            title: pTitle.value,
            pclass: selectedClass,
            sex: pSex.value,
            age: parseFloat(pAge.value),
            fare: parseFloat(pFare.value),
            embarked: pEmbarked.value,
            sibsp: parseInt(pSibsp.value) || 0,
            parch: parseInt(pParch.value) || 0
        };

        try {
            const response = await fetch('/predict', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error(`HTTP xatosi: ${response.status}`);

            const data = await response.json();

            if (data.success) {
                setTimeout(() => {
                    resStampText.textContent = data.stamp_status;
                    stampSealBadge.className = 'stamp-seal-badge slam-animated';
                    stampSealBadge.classList.add(data.stamp_type === 'survived' ? 'stamp-survived' : 'stamp-perished');
                }, 350);

                animateScore(data.survived_prob);

                resProgressFill.style.width = `${data.survived_prob}%`;
                if (data.survived_prob >= 60) {
                    resProgressFill.style.background = 'linear-gradient(90deg, #16a34a, #4ade80)';
                } else if (data.survived_prob >= 40) {
                    resProgressFill.style.background = 'linear-gradient(90deg, #ca8a04, #facc15)';
                } else {
                    resProgressFill.style.background = 'linear-gradient(90deg, #dc2626, #f87171)';
                }

                resVerdict.textContent = `"${data.verdict}"`;

                if (data.factors && data.factors.length >= 2) {
                    resFactor1.innerHTML = `<strong>1-omil:</strong> ${data.factors[0]}`;
                    resFactor2.innerHTML = `<strong>2-omil:</strong> ${data.factors[1]}`;
                    resFactor2.style.display = 'block';
                } else if (data.factors && data.factors.length === 1) {
                    resFactor1.innerHTML = `<strong>Asosiy omil:</strong> ${data.factors[0]}`;
                    resFactor2.style.display = 'none';
                }

            } else {
                alert(`Xatolik: ${data.error || 'Noma\'lum xatolik yuz berdi'}`);
            }

        } catch (err) {
            console.error(err);
            alert(`Ulanishda xatolik yuz berdi: ${err.message}`);
        } finally {
            btnCalculateFate.disabled = false;
        }
    });

    function animateScore(target) {
        let current = 0;
        const duration = 1200;
        const stepTime = 25;
        const step = target / (duration / stepTime);

        const timer = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(timer);
            }
            resProb.textContent = `${current.toFixed(1)}%`;
        }, stepTime);
    }

    // Boshlang'ich holatni to'g'ri o'rnatish
    updateClassUI(3, false);

    // Boshlang'ich sahifada (0-qadam): Keyingi qadam (1-qadam) videolarini fonda keshga yuklash
    preloadVideos(['passenger_man.mp4', 'passenger_woman.mp4']);
});
