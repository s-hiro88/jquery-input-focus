/*
 * jquery.inputfocus.js - jQuery plugin.
 *
 * Modified by froop http://github.com/froop/jquery-input-focus
 * Created by Hidepyon http://d.hatena.ne.jp/Hidepyon/
 *   See: http://d.hatena.ne.jp/Hidepyon/20090903/1251988911
 *
 * Copyright (c) 2011 Hidepyon
 * Copyright (c) 2012-2014 froop
 * The MIT License (http://www.opensource.org/licenses/mit-license.php)
 */
/*global jQuery, window */
(function ($) {
	"use strict";

	var KEY_TAB = "Tab",
		KEY_ENTER = "Enter",
		KEY_LEFT = "ArrowLeft",
		KEY_UP = "ArrowUp",
		KEY_RIGHT = "ArrowRight",
		KEY_DOWN = "ArrowDown";

	function getCaretPos(item) {
		var caretPos = 0;
		if (item.selectionStart || item.selectionStart === 0) {
			caretPos = item.selectionStart;
		}
		return caretPos;
	}

	function isFocusable($input) {
		if ($input.hasClass("focusable")) {
			return $input.is(":visible");
		}
		return $input.is(":visible") &&
			$input.is(":enabled") &&
			$input.css("visibility") !== "hidden" &&
			$input.attr("type") != "hidden" && // for IE bug ?
			$input.attr("tabindex") !== "-1" &&
			!$input.prop("readonly");
	}

	function findNextFocusByIndex($inputs, reverse, loop, baseIdx) {
		var ln = $inputs.length,
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
			var $input = $($inputs[j]);
			if (isFocusable($input)) {
				//対象のオブジェクトを戻す
				return $input;
			}
			j = toNextIndex(j);
		} while (j !== guard);
		//対象オブジェクトなし
		return null;
	}

	function focus($target) {
		// 移動先でkeydownが起こらないようにsetTimeoutする。Firefoxのみの問題
		setTimeout(function () {
			var target = $target[0];
			$target.focus();
			if (target && typeof target.select === "function" && !$target.is(":button")) {
				target.select();
			}
		}, 0);
	}

	function focusFirst($parent) {
		var $first = findNextFocusByIndex($(":input,.focusable", $parent), false, true, -1);
		if ($first) {
			focus($first);
		}
	}

	$.fn.inputFocus = function (options) {
		var $elements = this;
		var defaults = {
			"enter": false,
			"tab": false,
			"upDown": false,
			"leftRight": false,
			"focusFirst": false,
			"loop": true
		};
		var setting = $.extend({}, defaults, options);

		$elements.on("keydown", function (event) {
			var $inputs = $(":input,.focusable", $elements),
				keyCode = event.key,
				shiftKey = event.shiftKey,
				target = event.target,
				type = target.type,
				$next = null;

			// 次のフォーカス可能要素を探す
			function findNextFocusOnKeydown() {
				var reverse = shiftKey || keyCode === KEY_LEFT || keyCode === KEY_UP;
				var ln = $inputs.length;
				var i;
				for (i = 0; i < ln; i++) {
					if ($inputs[i] === target) {
						break;
					}
				}
				if (i >= ln) {
					return null;
				}
				return findNextFocusByIndex($inputs, reverse, setting.loop, i);
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
					if ($(target).is("input:not([type=file]):not([type=checkbox]):not([type=radio])")) {
						if (keyCode === KEY_LEFT && getCaretPos(target) !== 0) {
							return false;
						}
						if (keyCode === KEY_RIGHT && getCaretPos(target) !== $(target).val().length) {
							return false;
						}
					}
					return true;
				}

				return isMoveFocusKey() && isMoveFocusField();
			}

			if (isMoveFocus()) {
				//次のフォームオブジェクト探す
				$next = findNextFocusOnKeydown();
			}
			if (!$next) {
				return true;
			}
			focus($next);
			//イベントを伝播しない
			return false;
		});

		if (setting.focusFirst) {
			focusFirst($elements);
		}

		return this;
	};

	$.fn.inputFocusFirst = function () {
		var $elements = this;
		focusFirst($elements);
		return this;
	};
})(jQuery);
