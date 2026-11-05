/**
 * R.M.S. TITANIC — 1912 CINEMATIC MULTI-STEP WIZARD
 * Enhanced Reactive Video & Family Logic Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. IKKI QAVATLI CROSS-FADE VIDEO ENGINE (Flicker-Free)
    // -------------------------------------------------------------
    let vA = document.getElementById('videoA');
    let vB = document.getElementById('videoB');
    const sceneLabel = document.getElementById('sceneLabel');

    // Boshlang'ich videoni xavfsiz ishga tushirish
    if (vA) {
        vA.muted = true;
        vA.play().catch(err => console.warn("Autoplay kutmoqda:", err));
    }

    let currentActiveEl = vA;
    let currentNextEl = vB;
    let lastLoadedVideoPath = '/static/videos/intro.mp4';

    const sceneDescriptions = {
        'intro.mp4': "Sautgempton porti (R.M.S. Titanic)",
        'passenger_boy.mp4': "Yosh yo'lovchi (Palubadagi o'g'il bola)",
        'passenger_girl.mp4': "Yosh yo'lovchi (Palubadagi qiz bola)",
        'passenger_man.mp4': "Erkak yo'lovchi (Dengiz manzarasi)",
        'passenger_woman.mp4': "Ayol yo'lovchi (Paluba sayri)",
        'passenger_elder_man.mp4': "Keksa janob (Kresloda o'tirgan Edwardian yo'lovchi)",
        'passenger_elder_woman.mp4': "Keksa xonim (Titanic palubasidagi buvi)",
        'class1.mp4': "1-klass: Hashamatli Grand Staircase zali",
        'class2.mp4': "2-klass: O'rta toifa kutubxonasi",
        'class3.mp4': "3-klass: Quyi tor Steerage yo'lagi",
        'alone.mp4': "Yolg'iz sayohatchi (Kema panjarasida)",
        'couple.mp4': "Juftlik / Hamrohlar (Palubadagi er-xotin)",
        'family.mp4': "Oila va bolalar (Palubada choyxo'rlik)",
        'boarding.mp4': "Bortga chiqish (Kemaga ko'tarilish yo'lagi)",
        'fate.mp4': "Muzdek Shimoliy Atlantika okeani (15-aprel, 1912)"
    };

    function crossFadeToVideo(videoPathOrName) {
        if (!currentNextEl || !currentActiveEl) return;

        // Pathni to'g'rilash
        let targetPath = videoPathOrName;
        if (!targetPath.startsWith('/static/videos/')) {
            targetPath = `/static/videos/${videoPathOrName}`;
        }
        if (!targetPath.endsWith('.mp4')) {
            targetPath += '.mp4';
        }

        if (lastLoadedVideoPath === targetPath) return;
        lastLoadedVideoPath = targetPath;

        const filename = targetPath.split('/').pop();

        // Sahna tavsif matnini silliq yangilash
        if (sceneLabel && sceneDescriptions[filename]) {
            sceneLabel.style.opacity = '0';
            setTimeout(() => {
                sceneLabel.textContent = sceneDescriptions[filename];
                sceneLabel.style.opacity = '1';
            }, 200);
        }

        currentNextEl.src = targetPath;
        currentNextEl.muted = true;
        currentNextEl.load();

        let hasSwapped = false;

        const performSwap = () => {
            if (hasSwapped) return;
            hasSwapped = true;

            currentNextEl.removeEventListener('canplay', performSwap);
            currentNextEl.removeEventListener('loadeddata', performSwap);

            currentNextEl.play().then(() => {
                currentNextEl.classList.remove('next-video');
                currentNextEl.classList.add('active-video');

                currentActiveEl.classList.remove('active-video');
                currentActiveEl.classList.add('next-video');

                // Elementlarni almashtirish
                const temp = currentActiveEl;
                currentActiveEl = currentNextEl;
                currentNextEl = temp;
            }).catch(err => {
                console.warn("Autoplay / play ruxsati:", err);
                currentNextEl.classList.remove('next-video');
                currentNextEl.classList.add('active-video');

                currentActiveEl.classList.remove('active-video');
                currentActiveEl.classList.add('next-video');

                const temp = currentActiveEl;
                currentActiveEl = currentNextEl;
                currentNextEl = temp;
            });
        };

        currentNextEl.addEventListener('canplay', performSwap);
        currentNextEl.addEventListener('loadeddata', performSwap);

        // Fallback: 800ms dan so'ng almashtirish
        setTimeout(() => {
            if (!hasSwapped) performSwap();
        }, 800);
    }

    // -------------------------------------------------------------
    // 2. VIDEO TANLASH MANTIQIY FUNKSIYALARI (1 va 3-BOSQICHLAR)
    // -------------------------------------------------------------
    function getPassengerVideo(gender, age) {
        const isMale = (gender === 'male' || gender === 'Erkak' || gender.toLowerCase().includes('erkak'));
        
        if (age < 14) {
            return isMale ? '/static/videos/passenger_boy.mp4' : '/static/videos/passenger_girl.mp4';
        } else if (age >= 55) {
            return isMale ? '/static/videos/passenger_elder_man.mp4' : '/static/videos/passenger_elder_woman.mp4';
        } else {
            return isMale ? '/static/videos/passenger_man.mp4' : '/static/videos/passenger_woman.mp4';
        }
    }

    function getFamilyVideo(sibsp, parch) {
        // sibsp: Turmush o'rtoq / aka-singillar
        // parch: Farzandlar / ota-ona
        if (sibsp === 0 && parch === 0) {
            return '/static/videos/alone.mp4';
        } else if (sibsp > 0 && parch === 0) {
            return '/static/videos/couple.mp4'; // Juftlik / aka-singil
        } else {
            return '/static/videos/family.mp4'; // Bolalar yoki ota-onali oila
        }
    }

    // -------------------------------------------------------------
    // 3. WIZARD BOSHQARUVI
    // -------------------------------------------------------------
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

    function getClassVideo() {
        if (selectedClass === 1) return '/static/videos/class1.mp4';
        if (selectedClass === 2) return '/static/videos/class2.mp4';
        return '/static/videos/class3.mp4';
    }

    function updateVideoForCurrentStep() {
        switch (currentStep) {
            case 0:
                crossFadeToVideo('/static/videos/intro.mp4');
                break;
            case 1:
                crossFadeToVideo(getPassengerVideo(pSex.value, parseInt(pAge.value) || 28));
                break;
            case 2:
                crossFadeToVideo(getClassVideo());
                break;
            case 3:
                crossFadeToVideo(getFamilyVideo(parseInt(pSibsp.value) || 0, parseInt(pParch.value) || 0));
                break;
            case 4:
                crossFadeToVideo('/static/videos/boarding.mp4');
                updateSummaryDetails();
                break;
            case 5:
                crossFadeToVideo('/static/videos/fate.mp4');
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
    }

    // -------------------------------------------------------------
    // 4. HODISALAR (EVENT LISTENERS)
    // -------------------------------------------------------------
    // 1-bosqich: Yosh va Jins o'zgarganda
    function handlePassengerIdentityChange() {
        const age = parseInt(pAge.value) || 28;
        pAgeVal.textContent = `${age} yosh`;
        if (currentStep === 1) {
            crossFadeToVideo(getPassengerVideo(pSex.value, age));
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

    // 2-bosqich: Klass tanlash
    classOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            classOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            selectedClass = parseInt(opt.getAttribute('data-pclass'));

            if (selectedClass === 1) {
                pFare.value = 75;
                pFareVal.textContent = '£ 75.0';
            } else if (selectedClass === 2) {
                pFare.value = 25;
                pFareVal.textContent = '£ 25.0';
            } else {
                pFare.value = 9;
                pFareVal.textContent = '£ 9.0';
            }

            if (currentStep === 2) {
                crossFadeToVideo(getClassVideo());
            }
        });
    });

    pFare.addEventListener('input', (e) => {
        pFareVal.textContent = `£ ${parseFloat(e.target.value).toFixed(1)}`;
    });

    // 3-bosqich: Oila a'zolari (SibSp va Parch)
    function handleFamilyInputChange() {
        const sibsp = parseInt(pSibsp.value) || 0;
        const parch = parseInt(pParch.value) || 0;

        if (sibsp === 0 && parch === 0) {
            familyStatusBadge.innerHTML = '<span>👤 Sayohat holati:</span> <strong>Yolg\'iz sayohatchi</strong>';
        } else if (sibsp > 0 && parch === 0) {
            familyStatusBadge.innerHTML = `<span>👫 Sayohat holati:</span> <strong>Juftlik / Hamrohlar (${sibsp + 1} kishi)</strong>`;
        } else {
            familyStatusBadge.innerHTML = `<span>👨‍👩‍👧‍👦 Sayohat holati:</span> <strong>Oila va bolalar (${sibsp + parch + 1} kishi)</strong>`;
        }

        if (currentStep === 3) {
            crossFadeToVideo(getFamilyVideo(sibsp, parch));
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
    // 5. NAVIGATION BUTTONS
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
    // 6. TAQDIRNI ANIQLASH (DETERMINE FATE) VA ML API
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
});
