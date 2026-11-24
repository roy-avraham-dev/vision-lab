/* learning layer for module 0 — widget placement (kid explanations, glossary and hints are being written) */
window.LAYER = window.LAYER || {};
window.LAYER.m0 = (function () {
  const map = {
    '1.1': ['w_install'], '1.2': ['w_java_py'], '1.3': ['w_vectorize'], '1.4': ['w_shape', 'w_uint8'], '1.5': ['w_elem'], '1.6': ['w_slice'], '1.7': ['w_mask'], '1.8': ['w_axis'], '1.9': ['w_bcast'], '1.10': ['w_funcs'],
    '2.1': ['w_vec_faces'], '2.2': ['w_vec_add'], '2.3': ['w_norm'], '2.4': ['w_dot'], '2.5': ['w_proj'], '2.6': ['w_lincomb', 'w_gray'],
    '3.1': ['w_matidx'], '3.2': ['w_matvec'], '3.3': ['w_transform'], '3.4': ['w_compose'], '3.5': ['w_transpose'], '3.6': ['w_inverse'], '3.7': ['w_det'], '3.8': ['w_rot3d'],
    '4.1': ['w_translate_fail'], '4.2': ['w_homog'], '4.3': ['w_affine'], '4.4': ['w_homography'], '4.5': ['w_pinhole'],
    '5.1': ['w_lines'], '5.2': ['w_lsq'], '5.3': ['w_eigen'], '5.4': ['w_svd', 'w_svd_img'],
    '6.1': ['w_tangent'], '6.2': ['w_rules'], '6.3': ['w_sign'], '6.4': ['w_grad2d'], '6.5': ['w_imggrad'],
    '7.1': ['w_gears'], '7.2': ['w_compgraph'], '7.3': ['w_compgraph'], '7.4': ['w_act'], '7.5': ['w_vanish'],
    '8.1': ['w_fog'], '8.2': ['w_update'], '8.3': ['w_gd_table'], '8.4': ['w_lr'], '8.5': ['w_sgd'], '8.6': ['w_optim'], '8.7': ['w_fail'],
    '9.1': ['w_dice'], '9.2': ['w_meanvar'], '9.3': ['w_gauss'], '9.4': ['w_normalize'], '9.5': ['w_cov'], '9.6': ['w_pr'],
    '10.1': ['w_cond'], '10.2': ['w_bayes'], '10.3': ['w_mle'], '10.4': ['w_softmax'], '10.5': ['w_ce'], '10.6': ['w_focal'],
    '11.1': ['w_conv1d'], '11.2': ['w_conv2d'], '11.3': ['w_kernels'], '11.4': ['w_padstride'], '11.5': ['w_median'], '11.6': ['w_freq'], '11.7': ['w_cnn'],
    '12.1': ['w_neuron2d'], '12.2': ['w_ce'], '12.4': ['w_logreg'], '12.5': ['w_gradcheck'], '12.6': ['w_portfolio'] };
  const sections = {}; Object.keys(map).forEach(k => sections[k] = { widgets: map[k], kid: '<p><i>ההסבר הפשוט לסעיף הזה בכתיבה ויופיע כאן בגרסה הבאה.</i></p>' });
  return {
    sections, moduleKid: '<p>ההסבר הפשוט למודול בכתיבה.</p>', introKid: '',
    chapters: { 1: { widgets: ['w_img_numbers'] } },
    exWidgets: { '1.2': 'x1_2', '1.4': 'x1_4', '1.5': 'x1_5', '2.1': 'x2_1', '2.2': 'x2_2', '2.3': 'x2_3', '3.1': 'x3_1', '3.2': 'x3_2', '3.3': 'x3_3', '3.5': 'x3_5', '4.2': 'x4_2', '4.3': 'x4_3', '5.1': 'x5_1', '5.3': 'w_lsq', '5.4': 'w_svd_img', '6.1': 'x6_1', '6.2': 'w_sign', '6.3': 'x6_3', '7.5': 'x7_5', '8.1': 'x8_1', '8.2': ['x8_2', 'w_lr'], '8.3': 'w_optim', '9.1': 'x9_1', '9.3': 'w_gauss', '9.4': 'x9_4', '9.5': 'w_cov', '10.1': 'w_bayes', '10.2': 'x10_2', '10.4': 'w_focal', '11.1': 'x11_1', '11.2': 'x11_2', '11.3': 'w_kernels', '11.4': 'w_median', '12.2': 'w_logreg' },
    glossary: [], hints: {}, interview: [], decoders: {} };
})();
