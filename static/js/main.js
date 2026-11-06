/**
 * R.M.S. TITANIC — 1912 CINEMATIC MULTI-STEP WIZARD
 * Lead UI/UX Architect Edition:
 * - Full Two-Way Reactive Binding (Travel Class <-> Ticket Fare Slider)
 * - Strict Reactive Passenger & Family Logic
 * - Flicker-Free Dual Video Cross-Fade Engine
 */

document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // 1. DOM ELEMENTLAR VA HOLAT O'ZGARUVCHILARI
    // -------------------------------------------------------------
    let vA = document.getElementById('videoA');
    let vB = document.getElementById('videoB');
    const sceneLabel = document.getElementById('sceneLabel');

    if (vA) {
        vA.muted = true;
        vA.play().catch(err => console.warn("Autoplay kutmoqda:", err));
    }

    let currentActiveEl = vA;
    let currentNextEl = vB;
    let lastLoadedVideoPath = '/static/videos/intro.mp4';

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
    // 2. VIDEO SAHNALAR TAVSIFI VA KROSS-FEYD ENGINE
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

    function crossFadeToVideo(videoPathOrName) {
        if (!currentNextEl || !currentActiveEl) return;

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

                const temp = currentActiveEl;
                currentActiveEl = currentNextEl;
                currentNextEl = temp;
            }).catch(err => {
                console.warn("Autoplay policy handled:", err);
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

        setTimeout(() => {
            if (!hasSwapped) performSwap();
        }, 800);
    }

    // -------------------------------------------------------------
    // 3. YO'LOVCHI VA OILA VIDEO MANTIQI (1 va 3-BOSQICHLAR)
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
    // 4. KLASS VA CHIPTA NARXI: IKKI TOMONLAMA SINXRONIZATSIYA (TWO-WAY BINDING)
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
            crossFadeToVideo(classConfigs[targetClass].video);
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
    // 5. WIZARD QADAMLARI BOSHQARUVI
    // -------------------------------------------------------------
    function updateVideoForCurrentStep() {
        const age = parseInt(pAge.value) || 28;
        const gender = pSex.value;
        const sibsp = parseInt(pSibsp.value) || 0;
        const parch = parseInt(pParch.value) || 0;

        switch (currentStep) {
            case 0:
                crossFadeToVideo('/static/videos/intro.mp4');
                break;
            case 1:
                crossFadeToVideo(getPassengerBaseVideo(gender, age));
                break;
            case 2:
                crossFadeToVideo(getClassVideo());
                break;
            case 3:
                crossFadeToVideo(getFamilyStepVideo(gender, age, sibsp, parch));
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
    // 6. HODISALAR (EVENT LISTENERS)
    // -------------------------------------------------------------
    // 1-bosqich: Yosh va Jins o'zgarishi
    function handlePassengerIdentityChange() {
        const age = parseInt(pAge.value) || 28;
        pAgeVal.textContent = `${age} yosh`;
        if (currentStep === 1) {
            crossFadeToVideo(getPassengerBaseVideo(pSex.value, age));
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
            crossFadeToVideo(getFamilyStepVideo(gender, age, sibsp, parch));
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
    // 7. NAVIGATION BUTTONS & RESTART HANDLERS
    // -------------------------------------------------------------
    document.getElementById('btnStartWizard').addEventListener('click', () => goToStep(1));
    document.getElementById('btnBackTo0').addEventListener('click', () => goToStep(0));
    document.getElementById('btnToStep2').addEventListener('click', () => goToStep(2));
    document.getElementById('btnBackTo1').addEventListener('click', () => goToStep(1));
    document.getElementById('btnToStep3').addEventListener('click', () => goToStep(3));
    document.getElementById('btnBackTo2').addEventListener('click', () => goToStep(2));
    document.getElementById('btnToStep4').addEventListener('click', () => goToStep(4));
    document.getElementById('btnBackTo3').addEventListener('click', () => goToStep(3));

    // Barcha qayta sinash tugmalari (1 va 2-varaqadagi)
    document.querySelectorAll('.btnRestartWizard').forEach(btn => {
        btn.addEventListener('click', () => {
            const stampSeal = document.getElementById('stampSealBadge');
            if (stampSeal) stampSeal.className = 'stamp-seal-badge';
            switchResultTab(0);
            goToStep(0);
        });
    });

    // -------------------------------------------------------------
    // 8. NATIJA KARTASI CAROUSEL / TAB / SWIPE MANTIQI (5-BOSQICH)
    // -------------------------------------------------------------
    let currentResultTab = 0;
    const tabBtnFate = document.getElementById('tabBtnFate');
    const tabBtnBenchmark = document.getElementById('tabBtnBenchmark');
    const tabIndicator = document.getElementById('tabIndicator');
    const resultCarouselTrack = document.getElementById('resultCarouselTrack');
    const resultCarouselViewport = document.getElementById('resultCarouselViewport');

    function switchResultTab(tabIndex) {
        currentResultTab = tabIndex;

        if (tabIndex === 0) {
            if (tabBtnFate) {
                tabBtnFate.classList.add('active');
                tabBtnFate.setAttribute('aria-selected', 'true');
            }
            if (tabBtnBenchmark) {
                tabBtnBenchmark.classList.remove('active');
                tabBtnBenchmark.setAttribute('aria-selected', 'false');
            }
            if (tabIndicator) tabIndicator.style.transform = 'translateX(0%)';
            if (resultCarouselTrack) resultCarouselTrack.style.transform = 'translateX(0%)';

            // 1-varaqaga qaytganda barlarni 0 ga qaytaramiz (keyingi safar yana animatsiya bo'lishi uchun)
            document.querySelectorAll('.model-bar-fill').forEach(bar => {
                bar.style.width = '0%';
            });
        } else {
            if (tabBtnFate) {
                tabBtnFate.classList.remove('active');
                tabBtnFate.setAttribute('aria-selected', 'false');
            }
            if (tabBtnBenchmark) {
                tabBtnBenchmark.classList.add('active');
                tabBtnBenchmark.setAttribute('aria-selected', 'true');
            }
            if (tabIndicator) tabIndicator.style.transform = 'translateX(100%)';
            if (resultCarouselTrack) resultCarouselTrack.style.transform = 'translateX(-50%)';

            // 2-varaqaga o'tganda diagramma barlarini o'z foizigacha silliq to'ldiramiz
            setTimeout(() => {
                document.querySelectorAll('.model-bar-fill').forEach(bar => {
                    const targetWidth = bar.getAttribute('data-width') || '0%';
                    bar.style.width = targetWidth;
                });
            }, 100);
        }
    }

    if (tabBtnFate) {
        tabBtnFate.addEventListener('click', () => switchResultTab(0));
    }
    if (tabBtnBenchmark) {
        tabBtnBenchmark.addEventListener('click', () => switchResultTab(1));
    }

    // Touch Swipe va Mouse Drag Gesture mantiqi (Threshold: 40px)
    if (resultCarouselViewport) {
        let startX = 0;
        let startY = 0;
        let isTouching = false;

        // Mobil sensor (Touch)
        resultCarouselViewport.addEventListener('touchstart', (e) => {
            if (e.touches && e.touches.length > 0) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
                isTouching = true;
            }
        }, { passive: true });

        resultCarouselViewport.addEventListener('touchend', (e) => {
            if (!isTouching) return;
            isTouching = false;

            if (e.changedTouches && e.changedTouches.length > 0) {
                const endX = e.changedTouches[0].clientX;
                const endY = e.changedTouches[0].clientY;
                const diffX = endX - startX;
                const diffY = endY - startY;

                // Faqat gorizontal harakat vertikaldan ustun bo'lsa va 40px dan oshsa
                if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) >= 40) {
                    if (diffX < 0 && currentResultTab === 0) {
                        switchResultTab(1); // Chapga surish -> 2-varaqaga
                    } else if (diffX > 0 && currentResultTab === 1) {
                        switchResultTab(0); // O'ngga surish -> 1-varaqaga
                    }
                }
            }
        }, { passive: true });

        // Kompyuter sichqonchasi (Mouse Drag)
        let isMouseDown = false;
        let mouseStartX = 0;

        resultCarouselViewport.addEventListener('mousedown', (e) => {
            if (e.target.closest('button') || e.target.closest('a')) return;
            isMouseDown = true;
            mouseStartX = e.clientX;
        });

        window.addEventListener('mouseup', (e) => {
            if (!isMouseDown) return;
            isMouseDown = false;
            const diffX = e.clientX - mouseStartX;

            if (Math.abs(diffX) >= 40) {
                if (diffX < 0 && currentResultTab === 0) {
                    switchResultTab(1);
                } else if (diffX > 0 && currentResultTab === 1) {
                    switchResultTab(0);
                }
            }
        });
    }

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
        // Sukut bo'yicha 1-varaqani ("Yo'lovchi Taqdiri") ko'rsatamiz
        switchResultTab(0);
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
});
