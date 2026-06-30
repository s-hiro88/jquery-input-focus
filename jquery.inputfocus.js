/*
 * jquery.inputfocus.js - Native JavaScript focus navigation helper.
 *
 * Modified by froop http://github.com/froop/jquery-input-focus
 * Created by Hidepyon http://d.hatena.ne.jp/Hidepyon/
 *   See: http://d.hatena.ne.jp/Hidepyon/20090903/1251988911
 *
 * Copyright (c) 2011 Hidepyon
 * Copyright (c) 2012-2014 froop
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 */
/*global window */
(function (window) {
	"use strict";

	var KEY_TAB = "Tab",
		KEY_ENTER = "Enter",
		KEY_LEFT = "ArrowLeft",
		KEY_UP = "ArrowUp",
		KEY_RIGHT = "ArrowRight",
		KEY_DOWN = "ArrowDown";

	var TEXT_INPUT_SELECTOR =
		"input:not([type=checkbox]):not([type=radio]):not([type=file]),textarea";
	var FOCUSABLE_SELECTOR = "input,select,textarea,button,.focusable";

	function getCaretPos(item) {
		var caretPos = 0;
		if (item.selectionStart || item.selectionStart === 0) {
			caretPos = item.selectionStart;
		}
		return caretPos;
	}

	function matches(element, selector) {
		return element &&
			typeof element.matches === "function" &&
			element.matches(selector);
	}

	function isVisible(element) {
		var style;

		if (!element) {
			return false;
		}
		style = window.getComputedStyle(element);
		return style.display !== "none" &&
			style.visibility !== "hidden" &&
			element.getClientRects().length > 0;
	}

	function isFocusable(input) {
		if (input.classList.contains("focusable")) {
			return isVisible(input);
		}
		return isVisible(input) &&
			!input.disabled &&
			input.type !== "hidden" &&
			input.tabIndex >= 0 &&
			!input.readOnly;
	}

	function findNextFocusByIndex(inputs, reverse, loop, baseIdx) {
		var ln = inputs.length,
			j, guard;

		if (ln === 0) {
			return null;
		}

		function toNextIndex(before) {
			var mv = (reverse ? -1 : 1);
			var next = before + mv;
			if (next >= 0 && next < ln) {
				return next;
			} else if (loop) {
				return (ln + before + mv) % ln;
			} else {
				return before;
			}
		}

		j = toNextIndex(baseIdx);
		guard = j;
		do {
			var input = inputs[j];
			if (isFocusable(input)) {
				// 対象のオブジェクトを戻す
				return input;
			}
			j = toNextIndex(j);
		} while (j !== guard);
		// 対象オブジェクトなし
		return null;
	}

	function focus(target) {
		// 移動先でkeydownが起こらないようにsetTimeoutする。Firefoxのみの問題
		window.setTimeout(function () {
			if (!target) {
				return;
			}
			target.focus();
			if (
				typeof target.select === "function" &&
				matches(target, TEXT_INPUT_SELECTOR)
			) {
				target.select();
			}
		}, 0);
	}

	function toElementArray(elements) {
		if (!elements) {
			return [];
		}
		if (typeof elements === "string") {
			return Array.prototype.slice.call(document.querySelectorAll(elements));
		}
		if (elements.nodeType === 1 || elements === window || elements === document) {
			return [elements];
		}
		return Array.prototype.slice.call(elements);
	}

	function getInputs(parents) {
		return parents.reduce(function (inputs, parent) {
			return inputs.concat(
				Array.prototype.slice.call(parent.querySelectorAll(FOCUSABLE_SELECTOR))
			);
		}, []);
	}

	function focusFirst(elements) {
		var parents = toElementArray(elements);
		var first = findNextFocusByIndex(getInputs(parents), false, true, -1);
		if (first) {
			focus(first);
		}
	}

	function inputFocus(elements, options) {
		var parents = toElementArray(elements);
		var defaults = {
			"enter": false,
			"tab": false,
			"upDown": false,
			"leftRight": false,
			"focusFirst": false,
			"loop": true
		};
		var setting = Object.assign({}, defaults, options);

		parents.forEach(function (parent) {
			parent.addEventListener("keydown", function (event) {
				var inputs = getInputs(parents),
					keyCode = event.key,
					shiftKey = event.shiftKey,
					target = event.target,
					type = target.type,
					next = null;

				// 次のフォーカス可能要素を探す
				function findNextFocusOnKeydown() {
					var reverse = shiftKey || keyCode === KEY_LEFT || keyCode === KEY_UP;
					var i = inputs.indexOf(target);
					if (i < 0) {
						return null;
					}
					return findNextFocusByIndex(inputs, reverse, setting.loop, i);
				}

				function isMoveFocus() {
					function isKeyUpDown() {
						return keyCode === KEY_UP || keyCode === KEY_DOWN;
					}

					function isKeyLeftRight() {
						return keyCode === KEY_LEFT || keyCode === KEY_RIGHT;
					}

					function isMoveFocusKey() {
						if (setting.enter && keyCode === KEY_ENTER) {
							return true;
						}
						if (setting.tab && keyCode === KEY_TAB) {
							return true;
						}
						if (setting.upDown && isKeyUpDown()) {
							return true;
						}
						if (setting.leftRight && isKeyLeftRight()) {
							return true;
						}
						return false;
					}

					// 現フォーカス要素がフォーカス移動に対応するか
					function isMoveFocusField() {
						if (type === "file") {
							return false;
						}
						if (type === "textarea" && keyCode !== KEY_TAB) {
							return false;
						}
						if ((type === "select-one" || type === "select-multiple") && isKeyUpDown()) {
							return false;
						}
						if (matches(target, "input:not([type=file]):not([type=checkbox]):not([type=radio])")) {
							if (keyCode === KEY_LEFT && getCaretPos(target) !== 0) {
								return false;
							}
							if (keyCode === KEY_RIGHT && getCaretPos(target) !== target.value.length) {
								return false;
							}
						}
						return true;
					}

					return isMoveFocusKey() && isMoveFocusField();
				}

				if (isMoveFocus()) {
					// 次のフォームオブジェクト探す
					next = findNextFocusOnKeydown();
				}
				if (!next) {
					return;
				}
				focus(next);
				// イベントを伝播しない
				event.preventDefault();
				event.stopPropagation();
			});
		});

		if (setting.focusFirst) {
			focusFirst(parents);
		}

		return elements;
	}

	window.inputFocus = inputFocus;
	window.inputFocusFirst = focusFirst;
})(window);
