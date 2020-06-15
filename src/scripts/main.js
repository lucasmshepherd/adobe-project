gsap.registerPlugin(ScrollTrigger);

const ps = (function () {
  const self = this;
  let tlTransform, tlBrushes, tlBrushesContent, tlBrushesContentOut, tlRetouch, tlWhatsNew, tliPad; //gsap timelines

  let retouchImg, retouchContext, $retouchCanvas;
  let transformImg, transformContext, $transformCanvas

  let $retouch, $slide, $body, $retouchSequence, $transformSequence, $introVideo, $brushesVideo, $ipadVideo; //dom references
  let sceneConfig = {
    nativeWidth: 1679,
    nativeHeight: 1119,
    scenes: {
      intro: {
        //
      },
      transform: {
        sceneDuration: 15,
      },
      brushes: {
        sceneDuration: 15,
      },
      retouch: {
        sceneDuration: 10,
      },
      ipad: {
        sceneDuration: 7,
      },
    },
    videoBasePath: "assets/videos",
    videos: {
      transform: {
        frames: 83,
        selector: ".transform-sequence.t4",
        framesPath: 'assets/images/transform/frames/transform3-',
        width: 1280, //native size of images for canvas
        height: 991,
        pad: 2, //leading 0s in sequence filenames
      },
      retouch: {
        frames: 129,
        selector: '.retouch-sequence',
        sequence: 'assets/images/retouch/sequence-retouch.jpg',
        framesPath: 'assets/images/retouch/frames/retouch',
        width: 1280, 
        height: 843,
        pad: 3,
      }
    },
  };

  let appState = {
    curSceneIndex: 0,
    screenDims: {},
  };

  getScreenDims = function () {
    appState.screenDims.width = window.innerWidth;
    appState.screenDims.height = window.innerHeight;
  };

  addDomReferences = function () {
    $retouch = document.querySelector("#section-retouch");
    $slide = document.querySelector(".retouch-2");
    $body = document.getElementsByTagName("body")[0];
    $transformSequence = document.querySelector(".transform-sequence.t4");
    $retouchSequence = document.querySelector(".retouch-sequence");
    $retouchContentContainer = document.querySelector('.retouch-content-container');
    $introVideo = document.querySelector('.intro-video');
    $brushesVideo = document.querySelector('.brushes-video');
    $ipadVideo = document.querySelector('.ipad-video');
    $retouchCanvas = document.querySelector('.retouch-canvas');
    $transformCanvas = document.querySelector('.transform-canvas');
  };

  addListeners = function () {
    addUnloadListener();
    addVideoListeners();
  };

  addVideoListeners = function(){
    $brushesVideo.addEventListener('ended',onBrushesVideoEnded);
    $ipadVideo.addEventListener('ended',oniPadVideoEnded);
  }

  addUnloadListener = function () {
    window.addEventListener("beforeunload", onBeforeUnload);
  };

  initSubmodules = function () {
    ps.whatsNewModule.init();
  };

  resetTimeline = function(timelineRef){
    timelineRef.progress(0).pause();
  }

  resetVideo = function ($video) {
    $video.pause();
    $video.currentTime = 0;
  };

  playVideo = function ($video) {
    $video.play();
  };

  conditionallyPlayIntro = function(){
    const isVideoPlaying = checkIfVideoPlaying($introVideo);
    if (!isVideoPlaying){
      $introVideo.play();
    }
  }

  onTransformEnter = function () { //intro video stuff should happen in separate intro timeline?
    conditionallyPlayIntro();
    appState.curSceneIndex = 1;
    const vidConfig = sceneConfig.videos.transform;
    drawImageToCanvas(transformContext,getCurrentImagePath(vidConfig.framesPath,0,'.jpg',vidConfig.pad),transformImg);
  };

  onTransformUpdate = function({progress,direction}){
    if (tlTransform){
      if (direction === -1 && progress < .02){
        conditionallyPlayIntro(); //play intro video if we're at the top (within threshold, often we dont ever hit exact 0 point) and if the video is not already playing
      }
    }
  }

  onTransformLeaveBack = function () { //never fires because fixed top
    console.log('transform leave back');
    appState.curSceneIndex = 0;
    playVideo($introVideo);
  };

  onBrushesEnter = function () {
    appState.curSceneIndex = 2;
    playVideo($brushesVideo);
  };

  onBrushesLeaveBack = function () {
    appState.curSceneIndex = 1;
    resetVideo($brushesVideo);
  };

  onBrushesVideoEnded = function(){
  }

  onRetouchEnter = function () {
    appState.curSceneIndex = 2;
  };

  onRetouchUpdate = function(){
    const curProgress = tlRetouch.progress();
    const translateYVal = mapValue(curProgress,0,1,-100,100);
    $retouchContentContainer.style.transform = `translateY(${-translateYVal}px)`;
  }

  onRetouchLeave = function(){
    gsap.from(".ipad-video", { scale: 1.2, duration: 2 });
  }

  onRetouchLeaveBack = function () {
    gsap.to('.brushes-video',{
      opacity: 1,
    });
    appState.curSceneIndex = 3;
  };

  oniPadEnter = function () {
    appState.curSceneIndex = 4;
    playVideo($ipadVideo);
    gsap.to(".ipad-video", { scale: 1, duration: 2 })
  };

  oniPadLeaveBack = function () {
    appState.curSceneIndex = 3;
    resetVideo($ipadVideo);
    gsap.to(".ipad-video", { scale: 1.2, duration: 2 })
    //resetTimeline(tliPadContent);
  };

  oniPadLeaveForward = function(){
    //
  }

  oniPadVideoEnded = function(){
    //
  }

  onWhatsNewEnter = function () {
    appState.curSceneIndex = 5;
  };

  onWhatsNewLeaveBack = function () {
    appState.curSceneIndex = 4;
    playVideo($ipadVideo);
  };

  initCanvas = function () {
    const transformConfig = sceneConfig.videos.transform;
    $transformCanvas.width = transformConfig.width;
    $transformCanvas.height = transformConfig.height;
    transformContext = $transformCanvas.getContext('2d');
    transformImg = new Image();
    transformImg.src = getCurrentImagePath(transformConfig.framesPath,0,'.jpg',transformConfig.pad);
    transformImg.onload = function(){
      transformContext.drawImage(transformImg, 0, 0);
    }

    preloadFrames(transformConfig);

    const vidConfig = sceneConfig.videos.retouch;
    $retouchCanvas.width = vidConfig.width;
    $retouchCanvas.height = vidConfig.height;
    retouchContext = $retouchCanvas.getContext('2d');
    retouchImg = new Image();
    retouchImg.src = getCurrentImagePath(vidConfig.framesPath,0);
    retouchImg.onload = function(){
      retouchContext.drawImage(retouchImg, 0, 0);
    }

    preloadFrames(vidConfig);

  };

  preloadFrames = function(vidConfig){
    for (let i = 1; i < vidConfig.frames; i++) {
      const img = new Image();
      const imgSrc = getCurrentImagePath(vidConfig.framesPath,i,'.jpg',vidConfig.pad);
      img.src = imgSrc
    }
  }

  getCurrentImagePath = function(framesPath, frame, extension='.jpg',pad=3){
    return `${framesPath}${frame.toString().padStart(pad,'0')}${extension}`;
  }

  drawImageToCanvas = function(thisContext,thisPath,thisImage){
    thisImage.src = thisPath;
    thisContext.drawImage(thisImage, 0, 0);
  }

  initTimelines = function () {
    initTimelineTransform();
    initTimelineBrushes();
    initTimelineRetouch();
    initTimelineiPad();
    //initTimelineiPadContent();
    //initTimelineiPadContentOut();
    initTimelineWhatsNew();
  };

  initTimelineTransform = function () {

    introTitleTranslateY = '10vh';

    tlTransform = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-transform",
        pin: ".transform-container", // pin the trigger element while active?
        start: "top top", // when the top of the trigger hits the top of the viewport
        scrub: true, // smooth scrubbing, e.g. '1' takes 1 second to "catch up" to the scrollbar. `true` is a direct 1:1 between scrollbar and anim
        onEnter: onTransformEnter,
        onUpdate: onTransformUpdate,
        //onLeaveBack: onTransformLeaveBack,
        end: `+=${
          sceneConfig.scenes.transform.sceneDuration * appState.screenDims.height
        }`,
      },
    });

    tlTransform
      .to(".null", { opacity: 0, duration: 7,
        onUpdate: function () {
          const thisProgress = this.progress();
          
          const vidConfig = sceneConfig.videos.transform;
          const currentFrame = 
            Math.ceil(vidConfig.frames * thisProgress);
            const currentImagePath = getCurrentImagePath(vidConfig.framesPath,currentFrame,'.jpg',vidConfig.pad);
            drawImageToCanvas(transformContext,currentImagePath,transformImg);
        }, 
      }, "spacer")
      .fromTo('.transform-title-container',{translateY: 180}, {translateY: 0, duration: 7}, 'spacer')
      .fromTo('.transform-canvas',{translateY: -100}, {translateY: 0, duration: 7}, 'spacer')
      .from(".transform-rotating-title.rt1", { autoAlpha: 0, translateY: introTitleTranslateY}, "spacer")
      .to('.intro-container',{ translateY: -appState.screenDims.height, duration: 1, onComplete: function(){
        resetVideo($introVideo);
      }}, "spacer")
      .from(".transform-copy-p", { autoAlpha: 0 }, "spacer")
      .to(".transform-rotating-title.rt1", { autoAlpha: 0, ease: "none" }, "spacer+=1")
      .from(".transform-rotating-title.rt2", { autoAlpha: 0, delay: 0.5, ease: "none" }, "spacer+=1")
      .to(".transform-rotating-title.rt2", { autoAlpha: 0, ease: "none" }, "spacer+=2.75")
      .from(".transform-rotating-title.rt3", { autoAlpha: 0, delay: 0.5, ease: "none" }, "spacer+=2.75")
      .to(".transform-rotating-title.rt3", { autoAlpha: 0, ease: "none" }, "spacer+=4.4")
      .from(".transform-rotating-title.rt4", { autoAlpha: 0, delay: 0.5, ease: "none" }, "spacer+=4.4")
      .to(".transform-rotating-title.rt4", { autoAlpha: 0, ease: "none" }, "spacer+=6.5")
      .from(".transform-rotating-title.rt5", { autoAlpha: 0, delay: 0.5, ease: "none" }, "spacer+=6.5")
      .to(".null", { opacity: 0.5, duration: 3},'spacer2')
      .from(".transform-copy-container", { autoAlpha: 0 }, "spacer2")
      .to(".transform-title-container", { autoAlpha: 0 }, "spacer2+=2")
      .to(".transform-sequence", { autoAlpha: 0,duration: 1 }, "spacer2+=2")
      .addLabel("end");
  };

  initTimelineBrushes = function () {
    tlBrushes = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-brushes",
        pin: ".brushes-container",
        start: "top 100%", // when the top of the trigger hits the top of the viewport + 100% browser height
        end: `+=${sceneConfig.scenes.brushes.sceneDuration * appState.screenDims.height}`,
        anticipatePin: 1, //triggers the pin slightly early due to fact that pinning seems to happen a bit after top of this section disappears before it is re-pinned to top
        scrub: true, // smooth scrubbing, e.g. '1' takes 1 second to "catch up" to the scrollbar. `true` is a direct 1:1 between scrollbar and anim
        onEnter: onBrushesEnter,
        onLeaveBack: onBrushesLeaveBack,
      },
    });

    tlBrushes
      .from(".brushes-video", { autoAlpha: 0, duration: 2 }, "spacer1")
      .to(".null", { scale: 1, duration: 2.5 }, "spacer1")
      .fromTo('.brushes-content-container',{translateY: 80}, {translateY: -80, duration: 8}, 'textin')
      .from(".brushes-title", { autoAlpha: 0, translateY: 20 }, "textin")
      .from(
        ".brushes-intro",
        { autoAlpha: 0, translateY: 20 },
        "textin+=.5"
        )
      .from(".brushes-button-container", { autoAlpha: 0 }, "textin+=1")
      .to(".null", { opacity: 0, duration: 5 }, "textin+=1")
      .to(".brushes-title", { autoAlpha: 0, translateY: -20 }, "textin+=6.5")
      .to(
        ".brushes-intro",
        { autoAlpha: 0, translateY: -20, delay: .1 },
        "textin+=7"
      )
      .to(".brushes-button-container", { autoAlpha: 0, delay: .2 }, "textin+=7.5")
      .addLabel("end");
  };

  checkIfVideoPlaying = (video)=>{
    return !!(video.currentTime > 0 && !video.paused && !video.ended && video.readyState > 2);
  }

  initTimelineRetouch = function () {
    tlRetouch = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-retouch",
        pin: ".retouch-container",
        start: "top top+=100%", 
        end: `+=${
          sceneConfig.scenes.retouch.sceneDuration * appState.screenDims.height
        }`,
        scrub: true,
        onEnter: onRetouchEnter,
        onLeave: onRetouchLeave,
        onLeaveBack: onRetouchLeaveBack,
        onUpdate: onRetouchUpdate,
      },
    });

    tlRetouch
      .from(".fixed-section.retouch", { autoAlpha: 0, duration: 2 }, "retouchIn")
      .to('.brushes-content-container',{translateY: -100, duration: 2},'retouchIn')
      .from(
        ".retouch-1",
        {
          scale: 1.2,
        },
        "retouchIn"
      )
      .to(
        ".retouch-2",
        {
          width: `${appState.screenDims.width}px`,
        },
        "sliderIn"
      )
      .from(
        ".retouch-title-line.l1",
        { autoAlpha: 0, translateY: 20 },
        "sliderIn"
      )
      .to(
        ".null",
        { opacity: 1, duration: 1 },
        "spacer1"
      )
      .from(
        ".retouch-title-line.l2",
        { autoAlpha: 0, translateY: 20, onComplete: function(){
          drawImageToCanvas(retouchContext,getCurrentImagePath(sceneConfig.videos.retouch.framesPath,0),retouchImg);
        } },
        "remixIn"
      )
    
      .to(".null", { opacity: 0, duration: 5,
        onUpdate: function () {
          const thisProgress = this.progress();
          const vidConfig = sceneConfig.videos.retouch;
          const currentFrame = 
            Math.ceil(vidConfig.frames * thisProgress);
          const currentImagePath = getCurrentImagePath(vidConfig.framesPath,currentFrame);
          drawImageToCanvas(retouchContext,currentImagePath,retouchImg);
        }, 
      }, "spacer2")
      .from(
        ".retouch-title-line.l3",
        { autoAlpha: 0, translateY: 20 },
        "spacer2+=5.1"
      )
      .from(".retouch-intro", { autoAlpha: 0 }, "retouchIntroIn")
      .from(".retouch-button", { autoAlpha: 0 }, "retouchIntroButtonIn")
      .to(".null", { opacity: 1, duration: 2 }, "spacer7")
      .to(".retouch-content-container", { opacity: 0, duration: 1 }, "spacer7+=1")
      .addLabel("end");
  };

  initTimelineiPad = function () {
    tliPad = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-ipad",
        pin: ".ipad-container",
        start: "top top",
        scrub: true,
        onEnter: oniPadEnter,
        onLeaveBack: oniPadLeaveBack,
        end: `+=${
          sceneConfig.scenes.ipad.sceneDuration * appState.screenDims.height
        }`,
      },
    });

    tliPad
      .to(".null", { opacity: 0, duration: 2 }, "spacer1")
      .from(".ipad-title", { autoAlpha: 0, translateY: 20, duration: 1.5 }, "start")
      .from(".ipad-intro", { autoAlpha: 0, translateY: 20, duration: 1.5 }, "start+=.5")
      .from(".ipad-button-container", { autoAlpha: 0, duration: 1.5 }, "start+=1")
      .to(".null", { scale: .5, duration: 2, }, "spacer2")
      .to(".ipad-title", { autoAlpha: 0, translateY: -20, duration: 1.5 }, "ipadTitleOut")
      .to(".ipad-intro", { autoAlpha: 0, translateY: -40, duration: 1.5 }, "ipadTitleOut+=.5")
      .to(".ipad-button-container", { autoAlpha: 0, duration: 1.5 }, "ipadTitleOut+=1")
      .addLabel("end");
  };


  initTimelineWhatsNew = function () {
    tlWhatsNew = gsap.timeline({
      scrollTrigger: {
        trigger: "#section-whatsnew",
        pin: false,
        start: "top top",
        scrub: true,
        onEnter: onWhatsNewEnter,
        onLeaveBack: onWhatsNewLeaveBack,
      },
    });
  };

  onBeforeUnload = function (e) {
    //http://sandbox-666666.webflow.io/on-page-refresh-start-from-top-of-page
    e.preventDefault(); // If you prevent default behavior in Mozilla Firefox prompt will always be shown
    // Chrome requires returnValue to be set
    e.returnValue = "";
    $body.style.display = "none";
    window.scrollTo(0, 0);
  };

  mapValue = function (value, low1, high1, low2, high2) { //take a value between a high and low range and convert it to a value between another high and low range
    return low2 + ((high2 - low2) * (value - low1)) / (high1 - low1);
  };

  onReady = function () {
    setTimeout(() => {
      //MH - set some minimum time that the loader displays - may want to remove if loading is guaranteed to take a few seconds or more
      gsap.to(".loader-inner", {
        opacity: 0,
        duration: 0.3,
        onComplete: function () {
          $body.classList.toggle("loading", false);
        },
      });
    }, 1000);
  };

  toggleAssetLoading = function (isLoading = true) {
    document
      .getElementsByTagName("body")[0]
      .classList.toggle("loading", isLoading);
  };

  init = function () {
    toggleAssetLoading(true);
    getScreenDims();
    addDomReferences();
    addListeners();
    initCanvas();
    initTimelines();
    initSubmodules();
  };

  return {
    init: init,
    onReady: onReady,
  };
})();

document.addEventListener("DOMContentLoaded", (event) => {
  ps.init();
});

window.onload = function () {
  //MH wait for all initial assets to load before allowing scrolling (not counting scrolling video frames - may want to wait for those too)
  ps.onReady();
};
