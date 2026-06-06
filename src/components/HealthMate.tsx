import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Central Event Helpers to trigger emotion and speech updates anywhere in the app
export interface HealthMateCommand {
  emotion?: 'happy' | 'thoughtful' | 'calm' | 'excited' | 'speaking' | 'curious' | 'proud' | 'motivating' | 'walking' | 'concerned' | 'dancing' | 'jumping';
  text?: string;
  duration?: number; // optional timeout to revert after
}

// Global dispatcher to easily talk to HealthMate
export const updateHealthMate = (cmd: HealthMateCommand) => {
  window.dispatchEvent(new CustomEvent('healthmate-central-system', { detail: cmd }));
};

export interface HealthMateProps {
  expression?: 'happy' | 'thoughtful' | 'active' | 'calm' | 'excited' | 'speaking' | 'curious' | 'proud' | 'motivating' | 'walking' | 'concerned' | 'dancing' | 'jumping';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'custom';
  className?: string;
  animate?: boolean;
}

export default function HealthMate({
  expression: initialExpression = 'happy',
  size = 'md',
  className = '',
  animate = true
}: HealthMateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentExpression, setCurrentExpression] = useState(initialExpression);
  const [speechBubbleText, setSpeechBubbleText] = useState<string>('');
  const [isWaving, setIsWaving] = useState(false);

  // Sync initial expression changes
  useEffect(() => {
    setCurrentExpression(initialExpression);
  }, [initialExpression]);

  // Connect to the central system for real-time global character state updates!
  useEffect(() => {
    const handleCentralEvent = (e: Event) => {
      const customEvent = e as CustomEvent<HealthMateCommand>;
      if (customEvent.detail) {
        const { emotion, text, duration } = customEvent.detail;
        if (emotion) {
          // Normalize legacy mapping
          let norm: any = emotion;
          if (norm === 'active' || norm === 'keep_going') norm = 'excited';
          setCurrentExpression(norm);
        }
        if (text) {
          setSpeechBubbleText(text);
          // Highlight waving action on speech updates
          setIsWaving(true);
          setTimeout(() => setIsWaving(false), 2000);
        }

        // Reset text/emotion if duration is supplied
        if (duration) {
          setTimeout(() => {
            setCurrentExpression(initialExpression);
            setSpeechBubbleText('');
          }, duration);
        }
      }
    };

    window.addEventListener('healthmate-central-system', handleCentralEvent);
    return () => {
      window.removeEventListener('healthmate-central-system', handleCentralEvent);
    };
  }, [initialExpression]);

  // Size pixel map
  const sizeMap = {
    xs: 40,
    sm: 70,
    md: 120,
    lg: 180,
    xl: 260,
    xxl: 340,
    custom: 150
  };
  const sizePx = sizeMap[size] || sizeMap.md;

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // 1. Scene & Render Architecture
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#03070c', 0.04);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, 0.2, 4.2); // Perfect frame including leaf crown and full legs/shoes

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(sizePx, sizePx);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 2. Cinematic Pixar-Style lighting setup (glare + back rim light for soft depth)
    const ambientLight = new THREE.AmbientLight('#e2fbf0', 0.82); 
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#ffffff', 2.0); 
    keyLight.position.set(5, 6, 4);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLightLeft = new THREE.PointLight('#10b981', 1.6, 15); // Vibrant emerald glow bounce
    fillLightLeft.position.set(-3, 1.5, 2.5);
    scene.add(fillLightLeft);

    const rimLight = new THREE.SpotLight('#ffffff', 2.5, 12, Math.PI / 6, 0.5, 1); // Premium high-key rim light
    rimLight.position.set(0, 5, -3.5);
    scene.add(rimLight);

    // 3. Central Geometry Modeling (Oversized face + adorable legs + leaf crown)
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Materials
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffedd5, // Chubby rosy peach skin tone
      roughness: 0.35,
      metalness: 0.1,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: 0x10b981, // Iconic emerald green hair
      roughness: 0.45,
      metalness: 0.1,
    });

    const leafMat = new THREE.MeshStandardMaterial({
      color: 0x4ade80, // Lighter leaf crown sprout lime
      roughness: 0.22,
      metalness: 0.1,
    });

    const hoodieMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc, // Eggshell white premium matte hoodie
      roughness: 0.8,
    });

    const shoeMat = new THREE.MeshStandardMaterial({
      color: 0x16a34a, // Sporty green shoes
      roughness: 0.4,
    });

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.1 });
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x047857, roughness: 0.2 }); // Emerald irises
    const blushMat = new THREE.MeshBasicMaterial({ color: 0xfca5a5, transparent: true, opacity: 0.45 });

    // --- Skeletal Components ---
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.45, 0); // elevated slightly to clear legs and shoes
    characterGroup.add(headGroup);

    // Giant Lovable Head
    const headGeo = new THREE.SphereGeometry(0.76, 32, 32);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.scale.set(1.0, 0.94, 0.94);
    headGroup.add(headMesh);

    // Cute Back Hair Cap
    const hairGeo = new THREE.SphereGeometry(0.79, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2.3);
    const hairMesh = new THREE.Mesh(hairGeo, hairMat);
    hairMesh.rotation.x = -0.16;
    hairMesh.position.set(0, 0.05, -0.04);
    headGroup.add(hairMesh);

    // Left and Right Hair Side Bang Strands
    const strandGeo = new THREE.ConeGeometry(0.16, 0.42, 4);
    const strandL = new THREE.Mesh(strandGeo, hairMat);
    strandL.position.set(-0.35, 0.38, 0.58);
    strandL.rotation.set(0.12, 0, 0.6);
    headGroup.add(strandL);

    const strandR = new THREE.Mesh(strandGeo, hairMat);
    strandR.position.set(0.35, 0.38, 0.58);
    strandR.rotation.set(0.12, 0, -0.6);
    headGroup.add(strandR);

    // Massive Disney-Level Expressive Eyes
    const eyeL = new THREE.Group();
    eyeL.position.set(-0.30, 0.11, 0.58);
    headGroup.add(eyeL);

    const eyeR = new THREE.Group();
    eyeR.position.set(0.30, 0.11, 0.58);
    headGroup.add(eyeR);

    const eyeWhiteGeo = new THREE.SphereGeometry(0.19, 16, 16);
    const whiteL = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    whiteL.scale.set(1, 1.12, 0.85);
    eyeL.add(whiteL);

    const whiteR = new THREE.Mesh(eyeWhiteGeo, whiteMat);
    whiteR.scale.set(1, 1.12, 0.85);
    eyeR.add(whiteR);

    // Big green shiny Irises
    const irisGeo = new THREE.SphereGeometry(0.11, 16, 16);
    const pupilIrisL = new THREE.Mesh(irisGeo, irisMat);
    pupilIrisL.position.set(0.04, 0, 0.11);
    eyeL.add(pupilIrisL);

    const pupilIrisR = new THREE.Mesh(irisGeo, irisMat);
    pupilIrisR.position.set(-0.04, 0, 0.11);
    eyeR.add(pupilIrisR);

    // Black core pupils
    const pupilGeo = new THREE.SphereGeometry(0.065, 12, 12);
    const pupilCoreL = new THREE.Mesh(pupilGeo, blackMat);
    pupilCoreL.position.set(0.05, 0, 0.16);
    eyeL.add(pupilCoreL);

    const pupilCoreR = new THREE.Mesh(pupilGeo, blackMat);
    pupilCoreR.position.set(-0.05, 0, 0.16);
    eyeR.add(pupilCoreR);

    // Double reflective catchlight sparkles (brings character to life)
    const shineGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const twinkleL = new THREE.Mesh(shineGeo, whiteMat);
    twinkleL.position.set(0.075, 0.04, 0.19);
    eyeL.add(twinkleL);

    const twinkleR = new THREE.Mesh(shineGeo, whiteMat);
    twinkleR.position.set(-0.03, 0.04, 0.19);
    eyeR.add(twinkleR);

    // Cute Soft Blush Cheek circles
    const blushGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 16);
    const cheekL = new THREE.Mesh(blushGeo, blushMat);
    cheekL.rotation.x = Math.PI / 2.2;
    cheekL.position.set(-0.46, -0.12, 0.54);
    headGroup.add(cheekL);

    const cheekR = new THREE.Mesh(blushGeo, blushMat);
    cheekR.rotation.x = Math.PI / 2.2;
    cheekR.position.set(0.46, -0.12, 0.54);
    headGroup.add(cheekR);

    // Adorable tiny button nose
    const noseGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const noseMesh = new THREE.Mesh(noseGeo, skinMat);
    noseMesh.position.set(0, -0.05, 0.69);
    headGroup.add(noseMesh);

    // Smiley core mouth (curved tube geometry)
    const mouthGroup = new THREE.Group();
    mouthGroup.position.set(0, -0.21, 0.64);
    headGroup.add(mouthGroup);

    let mouthMesh: THREE.Mesh;
    const renderMouthShape = (mode: string) => {
      if (mouthMesh) mouthGroup.remove(mouthMesh);
      let curve;
      
      if (mode === 'concerned' || mode === 'sad') {
        curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.11, -0.04, 0),
          new THREE.Vector3(-0.05, 0.0, 0.04),
          new THREE.Vector3(0, 0.01, 0.05),
          new THREE.Vector3(0.05, 0.0, 0.04),
          new THREE.Vector3(0.11, -0.04, 0)
        ]);
      } else if (mode === 'thoughtful' || mode === 'curious') {
        curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.06, 0, 0),
          new THREE.Vector3(0, 0.005, 0.02),
          new THREE.Vector3(0.06, -0.005, 0)
        ]);
      } else {
        // Ultimate friendly curved crescent smile
        curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(-0.15, 0.05, 0),
          new THREE.Vector3(-0.08, -0.03, 0.04),
          new THREE.Vector3(0, -0.05, 0.05),
          new THREE.Vector3(0.08, -0.03, 0.04),
          new THREE.Vector3(0.15, 0.05, 0)
        ]);
      }
      
      const mGeo = new THREE.TubeGeometry(curve, 16, 0.032, 6, false);
      mouthMesh = new THREE.Mesh(mGeo, blackMat);
      mouthGroup.add(mouthMesh);
    };

    renderMouthShape(currentExpression);

    // --- Iconic Swaying Leaf Sprout on Head ---
    const crownGroup = new THREE.Group();
    crownGroup.position.set(0, 0.77, 0);
    headGroup.add(crownGroup);

    // Stem
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.015, 0.14, 0),
      new THREE.Vector3(0.05, 0.28, 0.02)
    ]);
    const stemGeo = new THREE.TubeGeometry(stemCurve, 10, 0.028, 8, false);
    const stemMesh = new THREE.Mesh(stemGeo, hairMat);
    crownGroup.add(stemMesh);

    // Left Leaf
    const leafGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const leafMeshR = new THREE.Mesh(leafGeo, leafMat);
    leafMeshR.scale.set(1.4, 0.11, 0.6);
    leafMeshR.rotation.set(0.15, 0.35, 0.55);
    leafMeshR.position.set(0.15, 0.26, 0.02);
    crownGroup.add(leafMeshR);

    // Right leaf
    const leafMeshL = new THREE.Mesh(leafGeo, leafMat);
    leafMeshL.scale.set(1.1, 0.09, 0.5);
    leafMeshL.rotation.set(-0.15, -0.4, -0.7);
    leafMeshL.position.set(-0.11, 0.21, -0.01);
    crownGroup.add(leafMeshL);

    // --- Hoodie body and trunk ---
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, -0.56, 0);
    characterGroup.add(bodyGroup);

    const bodyGeo = new THREE.CylinderGeometry(0.34, 0.54, 0.85, 32);
    const bodyMesh = new THREE.Mesh(bodyGeo, hoodieMat);
    bodyGroup.add(bodyMesh);

    // Badge Heart detailing on hoodie breast
    const heartGeo = new THREE.SphereGeometry(0.08, 12, 12);
    const heartBadge = new THREE.Mesh(heartGeo, hairMat);
    heartBadge.scale.set(1.2, 1.2, 0.4);
    heartBadge.position.set(0, 0.1, 0.45);
    bodyGroup.add(heartBadge);

    // --- Skeletal Arm Sleeve extensions ---
    const armL = new THREE.Group();
    armL.position.set(-0.43, 0.2, 0);
    bodyGroup.add(armL);

    const armR = new THREE.Group();
    armR.position.set(0.43, 0.2, 0);
    bodyGroup.add(armR);

    const sleeveGeo = new THREE.CylinderGeometry(0.11, 0.075, 0.42, 16);
    const meshSleeveL = new THREE.Mesh(sleeveGeo, hoodieMat);
    meshSleeveL.rotation.z = 0.42;
    meshSleeveL.position.set(-0.11, -0.11, 0);
    armL.add(meshSleeveL);

    const handSphereGeo = new THREE.SphereGeometry(0.075, 16, 16);
    const handMeshL = new THREE.Mesh(handSphereGeo, skinMat);
    handMeshL.position.set(-0.24, -0.26, 0);
    armL.add(handMeshL);

    const meshSleeveR = new THREE.Mesh(sleeveGeo, hoodieMat);
    meshSleeveR.rotation.z = -0.42;
    meshSleeveR.position.set(0.11, -0.11, 0);
    armR.add(meshSleeveR);

    const handMeshR = new THREE.Mesh(handSphereGeo, skinMat);
    handMeshR.position.set(0.24, -0.26, 0);
    armR.add(handMeshR);

    // --- Fully Detailed Adorable Biped legs and shoes ---
    const legL = new THREE.Group();
    legL.position.set(-0.26, -0.52, 0);
    bodyGroup.add(legL);

    const legR = new THREE.Group();
    legR.position.set(0.26, -0.52, 0);
    bodyGroup.add(legR);

    const boneGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.32, 12);
    const meshBoneL = new THREE.Mesh(boneGeo, skinMat);
    meshBoneL.position.set(0, -0.11, 0);
    legL.add(meshBoneL);

    const meshBoneR = new THREE.Mesh(boneGeo, skinMat);
    meshBoneR.position.set(0, -0.11, 0);
    legR.add(meshBoneR);

    // Super cute sneaker boots
    const shoeGeo = new THREE.BoxGeometry(0.2, 0.17, 0.38);
    const bootMeshL = new THREE.Mesh(shoeGeo, shoeMat);
    bootMeshL.position.set(0, -0.24, 0.08);
    legL.add(bootMeshL);

    const whiteSoleMeshL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.4), whiteMat);
    whiteSoleMeshL.position.set(0, -0.32, 0.08);
    legL.add(whiteSoleMeshL);

    const bootMeshR = new THREE.Mesh(shoeGeo, shoeMat);
    bootMeshR.position.set(0, -0.24, 0.08);
    legR.add(bootMeshR);

    const whiteSoleMeshR = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.04, 0.4), whiteMat);
    whiteSoleMeshR.position.set(0, -0.32, 0.08);
    legR.add(whiteSoleMeshR);


    // 4. Interactive Eye/Head Tracking (responds organically to cursor coordinates)
    let targetX = 0;
    let targetY = 0;

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      targetX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.85;
      targetY = -((e.clientY - rect.top) / rect.height - 0.5) * 0.65;
    };
    window.addEventListener('mousemove', onPointerMove);

    // 5. Procedural Animation loop
    const clock = new THREE.Clock();
    let animRequest: number;

    const renderLoop = () => {
      animRequest = requestAnimationFrame(renderLoop);
      const time = clock.getElapsedTime();

      if (animate) {
        // Natural look-at ease lerp rotation
        headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, targetX, 0.1);
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, targetY, 0.1);

        // Breathing cycle wave scaling
        const breathing = Math.sin(time * 2.2) * 0.035;
        headGroup.position.y = 0.45 + breathing;
        bodyGroup.scale.set(1, 1 + (breathing * 0.24), 1);

        // Sway sprout leaf details
        crownGroup.rotation.z = Math.sin(time * 3.2) * 0.1;
        crownGroup.rotation.y = Math.cos(time * 1.6) * 0.07;

        // Dynamic blink timers
        const triggerBlink = Math.floor(time) % 6 === 0 && (time % 1 < 0.15);
        if (triggerBlink) {
          eyeL.scale.y = 0.04;
          eyeR.scale.y = 0.04;
        } else {
          eyeL.scale.y = 1;
          eyeR.scale.y = 1;
        }

        // Handle expressive poses
        if (currentExpression === 'walking') {
          const runSp = 9.0;
          legL.rotation.x = Math.sin(time * runSp) * 0.52;
          legR.rotation.x = -Math.sin(time * runSp) * 0.52;
          armL.rotation.x = Math.cos(time * runSp) * 0.6;
          armR.rotation.x = -Math.cos(time * runSp) * 0.6;
          characterGroup.position.y = Math.abs(Math.sin(time * runSp)) * 0.07;
          characterGroup.rotation.y = 0;
        } 
        else if (currentExpression === 'excited' || isWaving || currentExpression === 'dancing' || currentExpression === 'jumping') {
          // Double hyper celebration wave
          const waveSp = 15.0;
          armL.rotation.z = Math.PI / 1.1 + Math.sin(time * waveSp) * 0.45;
          armR.rotation.z = -Math.PI / 1.1 - Math.sin(time * waveSp) * 0.45;
          characterGroup.position.y = Math.max(0, Math.sin(time * 8.5) * 0.28); // jump bouncing
          characterGroup.rotation.y = Math.sin(time * 3.5) * 0.14;
        } 
        else if (currentExpression === 'speaking' || currentExpression === 'motivating') {
          // Gentle pointing / speaking waves
          armR.rotation.z = -Math.PI / 2.3 + Math.sin(time * 4.8) * 0.25;
          armL.rotation.z = THREE.MathUtils.lerp(armL.rotation.z, 0, 0.12);
          characterGroup.position.y = 0;
          characterGroup.rotation.y = 0;
        } 
        else {
          // Standard standing posture
          legL.rotation.set(0, 0, 0);
          legR.rotation.set(0, 0, 0);
          armL.rotation.set(0, 0, 0);
          armR.rotation.set(0, 0, 0);
          characterGroup.position.y = 0;
          characterGroup.rotation.y = 0;
        }
      }

      renderer.render(scene, camera);
    };

    renderLoop();

    // Resize container bindings
    const handleResize = () => {
      if (!renderer) return;
      renderer.setSize(sizePx, sizePx);
    };
    window.addEventListener('resize', handleResize);

    // Garbage collection on unmount
    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animRequest);

      try {
        scene.traverse((object: any) => {
          if (!object.isMesh) return;
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach((mat) => mat.dispose());
          } else {
            object.material.dispose();
          }
        });
        renderer.dispose();
        container.innerHTML = '';
      } catch {}
    };
  }, [currentExpression, sizePx, animate, isWaving]);

  return (
    <div className={`relative inline-flex flex-col items-center select-none ${className}`}>
      
      {/* Speech bubble indicator bound to character whenever speech texts exist */}
      {speechBubbleText && (
        <div className="absolute bottom-[105%] bg-[#090F16] border border-emerald-500/30 text-white px-3 py-1.5 rounded-xl text-[10.5px] font-semibold text-center shadow-lg w-max max-w-[200px] animate-bounce z-25">
          <p className="leading-snug">{speechBubbleText}</p>
          <div className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-[#090F16] border-r border-b border-emerald-500/30 rotate-45" />
        </div>
      )}

      {/* Primary 3D WebGL stage container */}
      <div 
        ref={containerRef} 
        style={{ width: sizePx, height: sizePx }}
        className="rounded-full overflow-visible"
        id="healthmate-pro-character-stage"
      />
    </div>
  );
}
