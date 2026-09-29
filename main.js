import * as THREE from 'three';



//　シーンの作成
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0f172a);



//　カメラの設定
//　fov(視野角、75がデフォ) , aspect(アスペクト比、幅÷高さ) , 
//　near(最近接距離、値より手前は非表示) , far(値より億は非表示)
const camera = new THREE.PerspectiveCamera(
	75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.z = 10;



//　ウィンドウサイズへの対応
window.addEventListener('resize', () => {
	//　比率を更新
	camera.aspect = innerWidth / innerHeight;
	//　投影行列を再計算
	camera.updateProjectionMatrix();
	//　描画サイズを更新
	renderer.setSize(innerWidth, innerHeight);

	renderer.render(scene, camera);
})



//　描画エンジンの設定
//　setSize()　→　描画領域のピクセルサイズを指定
//　setPixelRatio()　→　Retina　など高解像度displayに対応
//　render()　→　renderer.render(scene, camera)で1フレーム描画
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);



//　ライト
const light = new THREE.DirectionalLight(
	0xffffff, 1.5 );	//　色、強さ
light.position.set(5, 10, 7);
scene.add(light);

const fill = new THREE.DirectionalLight(0xffffff, 0.4);
fill.position.set(-5, 0, 5);
const back = new THREE.DirectionalLight(0xffffff, 0.6);
back.position.set(0, 5, -5);
scene.add(fill, back);



//　床
const floorGeometry = new THREE.PlaneGeometry(50, 50);
const floorMaterial = new THREE.MeshStandardMaterial({
	color: 0xaaaaaaaa,
	roughness: 0.8,
	metalness: 0
});
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
floor.rotation.x = -Math.PI / 3;
scene.add(floor);



//　オブジェクト作成
const cubeGeometry = new THREE.BoxGeometry(3, 2, 4);
const cubeMaterial = new THREE.MeshStandardMaterial({
	color: 0x757575,
	roughness: 0.5,
	metalness: 0.3
});
const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
scene.add(cube);


//　アニメーションの設定







//　影
renderer.shadowMap.enabled = true;	//　影を有効化
light.castShadow = true;	//　光源
cube.castShadow = true;	//　影を落とす物体
floor.receiveShadow = true;		//　影を受ける床



//　読み込むやつ
renderer.render(scene, camera);