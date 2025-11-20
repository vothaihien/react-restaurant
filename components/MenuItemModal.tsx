import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  MenuItem,
  MenuItemSize,
  RecipeIngredient,
  Recipe,
  Category,
} from "@/features/menu/domain/types";
import type { Ingredient } from "@/features/inventory/domain/types";
import { useAppContext } from "@/core/context/AppContext";
import { useFeedback } from "@/core/context/FeedbackContext";
import { XIcon, PlusIcon, TrashIcon } from "@/components/Icons";
import { BASE_URL } from "@/shared/utils/api";
import { menuApi } from "@/shared/api/menu";

type RecipeDraftIngredient = {
  ingredientId: string;
  quantity: number | "";
};

type DishIngredientDraft = {
  ingredientId: string;
  defaultQuantity: number | "";
};

type VersionOption = {
  id: string;
  name: string;
  status?: string;
  order?: number | null;
};

interface MenuItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemToEdit?: MenuItem | null;
}

const MenuItemModal: React.FC<MenuItemModalProps> = ({
  isOpen,
  onClose,
  itemToEdit,
}) => {
  const {
    addMenuItem,
    updateMenuItem,
    ingredients,
    generateRecipeId,
    categories,
  } = useAppContext();
  const { notify } = useFeedback();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [selectedRecipeForIngredients, setSelectedRecipeForIngredients] =
    useState<string | null>(null);
  const [selectedRecipeDetailId, setSelectedRecipeDetailId] = useState<
    string | null
  >(null);
  const [uploadingImages, setUploadingImages] = useState<string[]>([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [recipeDraftName, setRecipeDraftName] = useState("");
  const [recipeDraftVersionId, setRecipeDraftVersionId] = useState("");
  const [recipeDraftIngredients, setRecipeDraftIngredients] = useState<
    RecipeDraftIngredient[]
  >([]);
  const [versionOptions, setVersionOptions] = useState<VersionOption[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [dishIngredients, setDishIngredients] = useState<DishIngredientDraft[]>(
    []
  );

  const ingredientMap = useMemo(() => {
    const map = new Map<string, Ingredient>();
    ingredients.forEach((ing) => {
      if (ing.id) {
        map.set(ing.id, ing);
      }
    });
    if (itemToEdit) {
      itemToEdit.sizes.forEach((size) => {
        size.recipe?.ingredients?.forEach((ri) => {
          const ing = ri.ingredient;
          if (ing?.id && !map.has(ing.id)) {
            map.set(ing.id, ing);
          }
        });
      });
    }
    return map;
  }, [ingredients, itemToEdit]);

  const ingredientOptions = useMemo(
    () => Array.from(ingredientMap.values()),
    [ingredientMap]
  );

  const recipeIngredientOptions = useMemo(() => {
    if (dishIngredients.length === 0) {
      return ingredientOptions;
    }
    return ingredientOptions.filter((opt) =>
      dishIngredients.some((item) => item.ingredientId === opt.id)
    );
  }, [ingredientOptions, dishIngredients]);

  const buildDraftIngredientsFromDish =
    useCallback((): RecipeDraftIngredient[] => {
      if (dishIngredients.length === 0) return [];
      return dishIngredients
        .map((item) => {
          const ing = ingredientMap.get(item.ingredientId);
          if (!ing) return null;
          return {
            ingredientId: ing.id,
            quantity:
              item.defaultQuantity === "" ? "" : Number(item.defaultQuantity),
          };
        })
        .filter((item): item is RecipeDraftIngredient => item !== null);
    }, [dishIngredients, ingredientMap]);

  const loadVersionOptions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const data = await menuApi.getVersions();
      const mapped: VersionOption[] = (data || [])
        .map((item: any) => ({
          id: item.maPhienBan || item.MaPhienBan || "",
          name: item.tenPhienBan || item.TenPhienBan || "",
          status: item.maTrangThai || item.MaTrangThai,
          order:
            typeof item.thuTu === "number"
              ? item.thuTu
              : typeof item.ThuTu === "number"
              ? item.ThuTu
              : null,
        }))
        .filter((item) => item.id && item.name);
      setVersionOptions(mapped);
      return mapped;
    } catch (error: any) {
      notify({
        tone: "warning",
        title: "Không thể tải phiên bản",
        description:
          error?.message ||
          "Không thể tải danh sách phiên bản từ server. Vui lòng thử lại.",
      });
      return [];
    } finally {
      setLoadingVersions(false);
    }
  }, [notify]);

  const getFirstAvailableVersion = useCallback(
    (options?: VersionOption[]) => {
      const source = options ?? versionOptions;
      return source.find(
        (opt) => !recipes.some((recipe) => recipe.versionId === opt.id)
      );
    },
    [versionOptions, recipes]
  );

  const getInitialState = (cats: Category[]): Omit<MenuItem, "id"> => ({
    name: "",
    description: "",
    categoryId: cats[0]?.id || "",
    category: cats[0]?.name || "",
    imageUrls: [],
    inStock: true,
    sizes: [],
  });

  const [formState, setFormState] = useState(() => getInitialState(categories));

  // Helper function to generate unique recipe ID
  const generateUniqueRecipeId = (): string => {
    let newId = generateRecipeId();
    let attempts = 0;
    const allRecipeIds = [
      ...recipes.map((r) => r.id),
      ...formState.sizes.map((s) => s.recipe.id),
    ];
    while (allRecipeIds.includes(newId) && attempts < 100) {
      newId = generateRecipeId();
      attempts++;
    }
    if (attempts >= 100) {
      // Fallback: use timestamp + random
      newId = `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    return newId;
  };

  // Helper function to generate unique recipe name
  const generateUniqueRecipeName = (): string => {
    const existingNames = recipes.map((r) => r.name);
    let recipeNumber = 1;
    let newName = `Công thức ${recipeNumber}`;

    // Find the next available number
    while (existingNames.includes(newName)) {
      recipeNumber++;
      newName = `Công thức ${recipeNumber}`;
    }

    return newName;
  };

  useEffect(() => {
    if (itemToEdit) {
      const sizes = JSON.parse(JSON.stringify(itemToEdit.sizes)); // Deep copy
      setFormState({
        name: itemToEdit.name,
        description: itemToEdit.description,
        categoryId: itemToEdit.categoryId,
        category: itemToEdit.category,
        imageUrls: [...itemToEdit.imageUrls],
        inStock: itemToEdit.inStock,
        sizes: sizes,
      });
      // Extract unique recipes from sizes (remove duplicates by ID)
      const recipeMap = new Map<string, Recipe>();
      sizes.forEach((s: MenuItemSize) => {
        if (!recipeMap.has(s.recipe.id)) {
          recipeMap.set(s.recipe.id, JSON.parse(JSON.stringify(s.recipe))); // Deep copy
        }
      });
      const uniqueRecipes = Array.from(recipeMap.values());
      setRecipes(uniqueRecipes);
      const ingredientDefaults = new Map<string, number>();
      uniqueRecipes.forEach((recipe) => {
        recipe.ingredients.forEach((ri) => {
          const ingredientId = ri.ingredient?.id;
          if (ingredientId && !ingredientDefaults.has(ingredientId)) {
            ingredientDefaults.set(ingredientId, ri.quantity);
          }
        });
      });
      setDishIngredients(
        Array.from(ingredientDefaults.entries()).map(([ingredientId, qty]) => ({
          ingredientId,
          defaultQuantity: qty,
        }))
      );
    } else {
      setFormState(getInitialState(categories));
      setRecipes([]);
      setDishIngredients([]);
    }
    setSelectedRecipeForIngredients(null);
    setSelectedRecipeDetailId(null);
  }, [itemToEdit, isOpen, categories]);

  useEffect(() => {
    if (!isOpen) return;
    loadVersionOptions();
  }, [isOpen, loadVersionOptions]);

  useEffect(() => {
    if (!itemToEdit && categories.length > 0) {
      setFormState((prev) => {
        if (prev.categoryId && prev.category) return prev;
        const first = categories[0];
        return {
          ...prev,
          categoryId: first.id,
          category: first.name,
        };
      });
    }
  }, [categories, itemToEdit]);

  // Remove duplicate recipes by ID
  useEffect(() => {
    const uniqueRecipesMap = new Map<string, Recipe>();
    recipes.forEach((r) => {
      if (!uniqueRecipesMap.has(r.id)) {
        uniqueRecipesMap.set(r.id, r);
      }
    });
    const uniqueRecipes = Array.from(uniqueRecipesMap.values());
    // Only update if there are actual duplicates (different length or different IDs)
    const hasDuplicates =
      uniqueRecipes.length !== recipes.length ||
      recipes.some(
        (r, idx) => recipes.findIndex((r2) => r2.id === r.id) !== idx
      );
    if (hasDuplicates) {
      setRecipes(uniqueRecipes);
    }
  }, [recipes.length, recipes.map((r) => r.id).join(",")]);

  useEffect(() => {
    setFormState((prev) => {
      const recipeIds = new Set(recipes.map((recipe) => recipe.id));
      let changed = false;
      const syncedSizes = prev.sizes.filter((size) => {
        const keep = recipeIds.has(size.recipe.id);
        if (!keep) {
          changed = true;
        }
        return keep;
      });
      const existingRecipeIds = new Set(
        syncedSizes.map((size) => size.recipe.id)
      );
      const additions: MenuItemSize[] = [];
      recipes.forEach((recipe) => {
        if (!existingRecipeIds.has(recipe.id)) {
          changed = true;
          additions.push({
            name: recipe.versionName || recipe.name,
            price: 0,
            recipe: JSON.parse(JSON.stringify(recipe)),
          });
        }
      });
      if (!changed) {
        return prev;
      }
      return { ...prev, sizes: [...syncedSizes, ...additions] };
    });
  }, [recipes]);

  useEffect(() => {
    if (
      selectedRecipeDetailId &&
      !recipes.some((recipe) => recipe.id === selectedRecipeDetailId)
    ) {
      setSelectedRecipeDetailId(null);
    }
  }, [recipes, selectedRecipeDetailId]);

  useEffect(() => {
    if (!isRecipeModalOpen) return;
    if (recipeDraftVersionId) return;
    const available = getFirstAvailableVersion();
    if (available) {
      setRecipeDraftVersionId(available.id);
      setRecipeDraftName((prev) =>
        prev ? prev : `Công thức ${available.name}`
      );
    }
  }, [isRecipeModalOpen, recipeDraftVersionId, getFirstAvailableVersion]);

  if (!isOpen) return null;

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      const isChecked = e.target.checked;
      setFormState((prev) => ({ ...prev, [name]: isChecked }));
    } else if (name === "categoryId") {
      const selectedCategory = categories.find((cat) => cat.id === value);
      setFormState((prev) => ({
        ...prev,
        categoryId: selectedCategory?.id || value || "",
        category: selectedCategory?.name || prev.category,
      }));
    } else {
      setFormState((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleToggleRecipeDetail = (recipeId: string) => {
    setSelectedRecipeDetailId((prev) => (prev === recipeId ? null : recipeId));
  };

  const handleAddDishIngredient = () => {
    if (ingredientOptions.length === 0) {
      notify({
        tone: "warning",
        title: "Chưa có nguyên liệu",
        description:
          "Bạn cần tạo nguyên liệu trong kho trước khi gán cho món ăn.",
      });
      return;
    }
    const availableOption = ingredientOptions.find(
      (opt) => !dishIngredients.some((item) => item.ingredientId === opt.id)
    );
    if (!availableOption) {
      notify({
        tone: "info",
        title: "Đã dùng hết nguyên liệu",
        description:
          "Tất cả nguyên liệu khả dụng đã được thêm vào danh sách của món ăn.",
      });
      return;
    }
    setDishIngredients((prev) => [
      ...prev,
      { ingredientId: availableOption.id, defaultQuantity: "" },
    ]);
  };

  const handleDishIngredientChange = (
    index: number,
    field: "ingredientId" | "defaultQuantity",
    value: string
  ) => {
    setDishIngredients((prev) => {
      const next = [...prev];
      if (!next[index]) {
        return prev;
      }
      if (field === "ingredientId") {
        if (
          next.some((item, idx) => idx !== index && item.ingredientId === value)
        ) {
          notify({
            tone: "warning",
            title: "Nguyên liệu trùng lặp",
            description:
              "Mỗi nguyên liệu chỉ cần khai báo một lần trong danh sách chung của món.",
          });
          return prev;
        }
        next[index] = { ...next[index], ingredientId: value };
      } else {
        next[index] = {
          ...next[index],
          defaultQuantity: value === "" ? "" : Number(value),
        };
      }
      return next;
    });
  };

  const handleRemoveDishIngredient = (index: number) => {
    const removed = dishIngredients[index];
    setDishIngredients((prev) => prev.filter((_, i) => i !== index));
    if (removed) {
      setRecipes((prev) =>
        prev.map((recipe) => ({
          ...recipe,
          ingredients: recipe.ingredients.filter(
            (ri) => ri.ingredient.id !== removed.ingredientId
          ),
        }))
      );
    }
  };

  // Image Handlers
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const files = Array.from(e.target.files) as File[];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        notify({
          tone: "warning",
          title: "File không hợp lệ",
          description: `${file.name} không phải là file ảnh.`,
        });
        continue;
      }

      // Kiểm tra kích thước file (10MB)
      if (file.size > 10 * 1024 * 1024) {
        notify({
          tone: "warning",
          title: "File quá lớn",
          description: `${file.name} vượt quá 10MB.`,
        });
        continue;
      }

      const fileId = `${file.name}_${Date.now()}`;
      setUploadingImages((prev) => [...prev, fileId]);

      try {
        // Nếu đang edit món ăn, truyền maMonAn để upload vào thư mục của món ăn
        const maMonAn = itemToEdit?.id || undefined;
        const result = await menuApi.uploadImage(file, maMonAn);

        setFormState((prev) => ({
          ...prev,
          imageUrls: [...prev.imageUrls, result.url],
        }));

        notify({
          tone: "success",
          title: "Upload thành công",
          description: `Đã upload ảnh ${file.name}`,
        });
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Upload thất bại",
          description: error.message || `Không thể upload ảnh ${file.name}`,
        });
      } finally {
        setUploadingImages((prev) => prev.filter((id) => id !== fileId));
      }
    }

    // Reset input để có thể chọn lại file cùng tên
    e.target.value = "";
  };
  const handleRemoveImage = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveSize = (index: number) => {
    setFormState((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((_, i) => i !== index),
    }));
  };
  const handleSizeChange = (
    index: number,
    field: "name" | "price",
    value: string | number
  ) => {
    const newSizes = [...formState.sizes];

    // Kiểm tra trùng tên phiên bản khi đổi tên
    if (field === "name" && typeof value === "string" && value.trim()) {
      const duplicateIndex = newSizes.findIndex(
        (s, i) =>
          i !== index && s.name.toLowerCase() === value.toLowerCase().trim()
      );
      if (duplicateIndex !== -1) {
        notify({
          tone: "warning",
          title: "Phiên bản trùng lặp",
          description: `Phiên bản "${value}" đã tồn tại cho món này.`,
        });
        return;
      }
    }

    newSizes[index] = { ...newSizes[index], [field]: value };
    setFormState((prev) => ({ ...prev, sizes: newSizes }));
  };

  // Recipe Handlers
  const resetRecipeDraft = (options?: VersionOption[]) => {
    const availableVersion = getFirstAvailableVersion(options);
    setRecipeDraftVersionId(availableVersion?.id || "");
    const generatedName = availableVersion
      ? `Công thức ${availableVersion.name}`
      : generateUniqueRecipeName();
    setRecipeDraftName(generatedName);
    const presetDrafts = buildDraftIngredientsFromDish();
    if (presetDrafts.length > 0) {
      setRecipeDraftIngredients(presetDrafts);
    } else {
      const firstIngredientId = ingredientOptions[0]?.id || "";
      setRecipeDraftIngredients(
        firstIngredientId
          ? [{ ingredientId: firstIngredientId, quantity: 0 }]
          : []
      );
    }
  };

  const handleAddRecipe = async () => {
    if (dishIngredients.length === 0) {
      notify({
        tone: "warning",
        title: "Chưa có nguyên liệu cho món",
        description:
          "Vui lòng thêm ít nhất một nguyên liệu trước khi tạo công thức.",
      });
      return;
    }
    const options =
      versionOptions.length > 0 ? versionOptions : await loadVersionOptions();
    const available = getFirstAvailableVersion(options);
    if (!available) {
      notify({
        tone: "warning",
        title: "Hết phiên bản khả dụng",
        description:
          "Không còn phiên bản nào để gán cho công thức mới. Vui lòng kiểm tra lại danh sách phiên bản.",
      });
      return;
    }
    resetRecipeDraft(options);
    setIsRecipeModalOpen(true);
  };

  const handleCloseRecipeModal = () => {
    setIsRecipeModalOpen(false);
    setRecipeDraftVersionId("");
  };

  const handleDraftVersionChange = (versionId: string) => {
    if (versionId && recipes.some((recipe) => recipe.versionId === versionId)) {
      notify({
        tone: "warning",
        title: "Phiên bản đã được sử dụng",
        description: "Vui lòng chọn phiên bản khác cho công thức mới.",
      });
      setRecipeDraftVersionId("");
      return;
    }
    setRecipeDraftVersionId(versionId);
    const selected = versionOptions.find((opt) => opt.id === versionId);
    if (selected && recipeDraftName.toLowerCase().startsWith("công thức")) {
      setRecipeDraftName(`Công thức ${selected.name}`);
    }
  };

  const handleAddDraftIngredient = () => {
    if (recipeIngredientOptions.length === 0) {
      notify({
        tone: "warning",
        title: "Chưa có nguyên liệu",
        description: "Không thể thêm công thức vì chưa có nguyên liệu nào.",
      });
      return;
    }
    const usedIds = recipeDraftIngredients.map((item) => item.ingredientId);
    const availableIngredient = recipeIngredientOptions.find(
      (ing) => !usedIds.includes(ing.id)
    );
    if (!availableIngredient) {
      notify({
        tone: "info",
        title: "Hết nguyên liệu khả dụng",
        description: "Tất cả nguyên liệu đã được sử dụng trong công thức này.",
      });
      return;
    }
    setRecipeDraftIngredients((prev) => [
      ...prev,
      { ingredientId: availableIngredient.id, quantity: 0 },
    ]);
  };

  const handleRemoveDraftIngredient = (index: number) => {
    setRecipeDraftIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDraftIngredientChange = (
    index: number,
    field: "ingredientId" | "quantity",
    value: string
  ) => {
    setRecipeDraftIngredients((prev) => {
      const next = [...prev];
      if (!next[index]) return prev;
      if (field === "ingredientId") {
        if (
          next.some((item, idx) => idx !== index && item.ingredientId === value)
        ) {
          notify({
            tone: "warning",
            title: "Nguyên liệu trùng lặp",
            description:
              "Mỗi nguyên liệu chỉ được chọn một lần trong công thức.",
          });
          return prev;
        }
        next[index] = { ...next[index], ingredientId: value };
      } else {
        next[index] = {
          ...next[index],
          quantity: value === "" ? "" : Number(value),
        };
      }
      return next;
    });
  };

  const handleSubmitRecipeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeDraftName.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu tên công thức",
        description: "Vui lòng nhập tên cho công thức.",
      });
      return;
    }
    if (recipeDraftIngredients.length === 0) {
      notify({
        tone: "warning",
        title: "Chưa có nguyên liệu",
        description: "Một công thức phải có ít nhất một nguyên liệu.",
      });
      return;
    }
    if (!recipeDraftVersionId) {
      notify({
        tone: "warning",
        title: "Thiếu phiên bản",
        description: "Vui lòng chọn phiên bản cho công thức.",
      });
      return;
    }
    if (recipes.some((r) => r.versionId === recipeDraftVersionId)) {
      notify({
        tone: "warning",
        title: "Phiên bản đã được sử dụng",
        description: "Phiên bản này đã được gán cho công thức khác.",
      });
      return;
    }
    const selectedVersion = versionOptions.find(
      (opt) => opt.id === recipeDraftVersionId
    );
    if (!selectedVersion) {
      notify({
        tone: "warning",
        title: "Phiên bản không hợp lệ",
        description: "Phiên bản đã chọn không tồn tại. Vui lòng chọn lại.",
      });
      return;
    }
    const hasEmptyIngredient = recipeDraftIngredients.some(
      (item) => !item.ingredientId
    );
    if (hasEmptyIngredient) {
      notify({
        tone: "warning",
        title: "Thiếu thông tin nguyên liệu",
        description: "Vui lòng chọn đầy đủ nguyên liệu cho từng dòng.",
      });
      return;
    }
    const hasInvalidQuantity = recipeDraftIngredients.some(
      (item) => item.quantity === "" || Number(item.quantity) <= 0
    );
    if (hasInvalidQuantity) {
      notify({
        tone: "warning",
        title: "Số lượng không hợp lệ",
        description: "Mỗi nguyên liệu cần có số lượng lớn hơn 0.",
      });
      return;
    }
    const duplicateCheck = new Set(
      recipeDraftIngredients.map((item) => item.ingredientId)
    );
    if (duplicateCheck.size !== recipeDraftIngredients.length) {
      notify({
        tone: "warning",
        title: "Nguyên liệu trùng lặp",
        description: "Không thể lưu công thức có nguyên liệu trùng nhau.",
      });
      return;
    }

    const recipeIngredients: RecipeIngredient[] = [];
    for (const item of recipeDraftIngredients) {
      const ingredient = ingredientMap.get(item.ingredientId);
      if (!ingredient) {
        notify({
          tone: "error",
          title: "Nguyên liệu không tồn tại",
          description:
            "Vui lòng kiểm tra lại danh sách nguyên liệu của công thức.",
        });
        return;
      }
      recipeIngredients.push({
        ingredient,
        quantity: Number(item.quantity),
      });
    }

    const newRecipe: Recipe = {
      id: generateUniqueRecipeId(),
      name: recipeDraftName.trim(),
      ingredients: recipeIngredients,
      versionId: recipeDraftVersionId,
      versionName: selectedVersion.name,
    };

    setRecipes((prev) => [...prev, newRecipe]);
    setSelectedRecipeForIngredients(newRecipe.id);
    setSelectedRecipeDetailId(newRecipe.id);
    setIsRecipeModalOpen(false);
    setRecipeDraftVersionId("");
    notify({
      tone: "success",
      title: "Đã thêm công thức",
      description: `Công thức "${newRecipe.name}" đã được tạo.`,
    });
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
    setFormState((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s.recipe.id !== recipeId),
    }));
    if (selectedRecipeForIngredients === recipeId) {
      setSelectedRecipeForIngredients(null);
    }
    if (selectedRecipeDetailId === recipeId) {
      setSelectedRecipeDetailId(null);
    }
  };

  const handleRecipeNameChange = (recipeId: string, name: string) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === recipeId ? { ...r, name } : r))
    );
    // Also update in sizes if used
    const newSizes = formState.sizes.map((s) =>
      s.recipe.id === recipeId ? { ...s, recipe: { ...s.recipe, name } } : s
    );
    setFormState((prev) => ({ ...prev, sizes: newSizes }));
  };

  const handleRecipeVersionChange = (recipeId: string, versionId: string) => {
    if (!versionId) {
      notify({
        tone: "warning",
        title: "Thiếu phiên bản",
        description: "Vui lòng chọn phiên bản hợp lệ cho công thức này.",
      });
      return;
    }
    const duplicated = recipes.some(
      (r) => r.id !== recipeId && r.versionId === versionId
    );
    if (duplicated) {
      notify({
        tone: "warning",
        title: "Phiên bản đã được sử dụng",
        description: "Mỗi phiên bản chỉ có thể gắn với một công thức.",
      });
      return;
    }
    const selected = versionOptions.find((opt) => opt.id === versionId);
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              versionId,
              versionName: selected?.name || r.versionName,
            }
          : r
      )
    );
    setFormState((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s) =>
        s.recipe.id === recipeId
          ? {
              ...s,
              name: selected?.name || s.name,
              recipe: {
                ...s.recipe,
                versionId,
                versionName: selected?.name || s.recipe.versionName,
              },
            }
          : s
      ),
    }));
  };

  const handleAddIngredientToRecipe = (recipeId: string) => {
    if (recipeIngredientOptions.length > 0) {
      // Check if ingredient already exists in recipe
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        const availableIngredients = recipeIngredientOptions.filter(
          (ing) => !recipe.ingredients.some((ri) => ri.ingredient.id === ing.id)
        );
        if (availableIngredients.length === 0) {
          notify({
            tone: "info",
            title: "Đã đủ nguyên liệu",
            description:
              "Tất cả nguyên liệu khả dụng đã có trong công thức này.",
          });
          return;
        }
        const newIngredient: RecipeIngredient = {
          ingredient: availableIngredients[0],
          quantity: 0,
        };
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === recipeId
              ? { ...r, ingredients: [...r.ingredients, newIngredient] }
              : r
          )
        );
        // Also update in sizes if used
        const newSizes = formState.sizes.map((s) =>
          s.recipe.id === recipeId
            ? {
                ...s,
                recipe: {
                  ...s.recipe,
                  ingredients: [...s.recipe.ingredients, newIngredient],
                },
              }
            : s
        );
        setFormState((prev) => ({ ...prev, sizes: newSizes }));
      }
    }
  };

  const handleRemoveIngredientFromRecipe = (
    recipeId: string,
    ingredientIndex: number
  ) => {
    setRecipes((prev) =>
      prev.map((r) =>
        r.id === recipeId
          ? {
              ...r,
              ingredients: r.ingredients.filter(
                (_, i) => i !== ingredientIndex
              ),
            }
          : r
      )
    );
    // Also update in sizes if used
    const newSizes = formState.sizes.map((s) =>
      s.recipe.id === recipeId
        ? {
            ...s,
            recipe: {
              ...s.recipe,
              ingredients: s.recipe.ingredients.filter(
                (_, i) => i !== ingredientIndex
              ),
            },
          }
        : s
    );
    setFormState((prev) => ({ ...prev, sizes: newSizes }));
  };

  const handleIngredientChangeInRecipe = (
    recipeId: string,
    ingredientIndex: number,
    field: "ingredient" | "quantity",
    value: string | number
  ) => {
    setRecipes((prev) =>
      prev.map((r) => {
        if (r.id === recipeId) {
          const newIngredients = r.ingredients.map((item, idx) => {
            if (idx === ingredientIndex) {
              if (field === "ingredient") {
                const selectedIngredient = ingredientMap.get(value as string);
                if (selectedIngredient) {
                  return { ...item, ingredient: selectedIngredient };
                }
              } else {
                return { ...item, quantity: Number(value) };
              }
            }
            return item;
          });
          return { ...r, ingredients: newIngredients };
        }
        return r;
      })
    );
    // Also update in sizes if used
    setFormState((prev) => ({
      ...prev,
      sizes: prev.sizes.map((s) => {
        if (s.recipe.id === recipeId) {
          const newIngredients = s.recipe.ingredients.map((item, idx) => {
            if (idx === ingredientIndex) {
              if (field === "ingredient") {
                const selectedIngredient = ingredients.find(
                  (ing) => ing.id === value
                );
                if (selectedIngredient) {
                  return { ...item, ingredient: selectedIngredient };
                }
              } else {
                return { ...item, quantity: Number(value) };
              }
            }
            return item;
          });
          return { ...s, recipe: { ...s.recipe, ingredients: newIngredients } };
        }
        return s;
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const {
      name,
      description,
      category,
      categoryId,
      imageUrls,
      inStock,
      sizes,
    } = formState;

    if (!name || sizes.length === 0 || imageUrls.length === 0) {
      notify({
        tone: "error",
        title: "Thiếu thông tin món ăn",
        description:
          "Vui lòng nhập tên món, thêm ít nhất một hình ảnh và một phiên bản món ăn.",
      });
      return;
    }

    // Kiểm tra mỗi size phải có công thức với nguyên liệu
    for (const size of sizes) {
      if (!size.recipe || size.recipe.ingredients.length === 0) {
        notify({
          tone: "error",
          title: "Thiếu công thức",
          description: `Phiên bản "${size.name}" chưa có công thức hoặc chưa có nguyên liệu.`,
        });
        return;
      }
      if (!size.recipe.versionId) {
        notify({
          tone: "error",
          title: "Thiếu phiên bản",
          description: `Phiên bản "${size.name}" chưa được gán mã phiên bản.`,
        });
        return;
      }
    }

    const matchedCategory = categories.find(
      (cat) => cat.id === categoryId || cat.name === category
    );

    if (itemToEdit) {
      // TODO: Implement update API
      updateMenuItem({
        id: itemToEdit.id,
        name,
        description,
        category: matchedCategory?.name || category,
        categoryId: matchedCategory?.id ?? categoryId ?? itemToEdit?.categoryId,
        imageUrls,
        inStock,
        sizes,
      });
      notify({
        tone: "success",
        title: "Đã cập nhật món",
        description: `${name} đã được lưu thành công.`,
      });
      onClose();
    } else {
      // Tạo món ăn mới qua API
      try {
        // Chuyển đổi dữ liệu sang format API
        const phienBanMonAns = sizes.map((size, index) => ({
          MaPhienBan: size.recipe.versionId,
          TenPhienBan: size.name,
          Gia: size.price,
          MaTrangThai: inStock ? "CON_HANG" : "HET_HANG",
          IsShow: true,
          ThuTu: index + 1,
          CongThucNauAns: size.recipe.ingredients.map((ing) => ({
            MaNguyenLieu: ing.ingredient.id,
            SoLuongCanDung: ing.quantity || 0,
          })),
        }));

        const apiData = {
          TenMonAn: name,
          MaDanhMuc: matchedCategory?.id || categoryId || null,
          IsShow: true,
          HinhAnhUrls: imageUrls,
          PhienBanMonAns: phienBanMonAns,
        };

        await menuApi.createDish(apiData);

        // Cũng thêm vào local state để hiển thị ngay
        addMenuItem({
          name,
          description,
          category: matchedCategory?.name || category,
          categoryId: matchedCategory?.id ?? categoryId,
          imageUrls,
          inStock,
          sizes,
        });

        notify({
          tone: "success",
          title: "Đã thêm món mới",
          description: `${name} đã được thêm vào thực đơn thành công.`,
        });
        onClose();
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Lỗi khi thêm món",
          description:
            error?.message || "Không thể thêm món ăn mới. Vui lòng thử lại.",
        });
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-hidden">
      <div className="bg-white shadow-2xl w-full h-screen max-h-screen flex flex-col overflow-hidden">
        <header className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
          <h2 className="text-2xl font-bold text-gray-900">
            {itemToEdit ? "Chỉnh sửa Món" : "Thêm Món Mới"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
          >
            <XIcon className="w-7 h-7" />
          </button>
        </header>
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto flex-1 bg-gray-50 scrollbar-hide min-h-0"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full min-h-0">
            {/* Phần 1: Nhập thông tin & thao tác */}
            <div className="space-y-6 overflow-y-auto pr-4 scrollbar-hide min-h-0">
              <section className="space-y-3 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Thông tin món ăn
                  </h3>
                </div>

                {itemToEdit && (
                  <div>
                    <label
                      htmlFor="itemId"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Mã món
                    </label>
                    <input
                      type="text"
                      id="itemId"
                      name="itemId"
                      value={itemToEdit.id}
                      readOnly
                      className="mt-1 block w-full bg-gray-100 border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-500 cursor-not-allowed focus:outline-none focus:ring-0"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Tên món
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formState.name}
                      onChange={handleInputChange}
                      required
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="category"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Danh mục
                    </label>
                    <select
                      id="category"
                      name="categoryId"
                      value={formState.categoryId || ""}
                      onChange={handleInputChange}
                      disabled={categories.length === 0}
                      className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                    >
                      <option value="" disabled>
                        Chọn danh mục
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formState.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Nguyên liệu món ăn
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddDishIngredient}
                      disabled={ingredientOptions.length === 0}
                      className={`flex items-center gap-1 text-xs py-1.5 px-3 font-semibold rounded-lg transition ${
                        ingredientOptions.length === 0
                          ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-500"
                      }`}
                      title={
                        ingredientOptions.length === 0
                          ? "Chưa có nguyên liệu trong kho để lựa chọn"
                          : undefined
                      }
                    >
                      <PlusIcon className="w-3.5 h-3.5" /> Thêm nguyên liệu
                    </button>
                  </div>
                  {dishIngredients.length === 0 ? (
                    <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4">
                      Chưa có nguyên liệu nào. Nhấn &quot;Thêm nguyên liệu&quot;
                      để chọn từ danh sách kho hiện có.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {dishIngredients.map((item, index) => {
                        const selectedIngredient = ingredientMap.get(
                          item.ingredientId
                        );
                        return (
                          <div
                            key={`${item.ingredientId}-${index}`}
                            className="grid grid-cols-1 md:grid-cols-11 gap-3 items-center border border-gray-200 rounded-lg p-3 bg-gray-50"
                          >
                            <div className="md:col-span-10">
                              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide">
                                Nguyên liệu
                              </label>
                              <select
                                value={item.ingredientId}
                                onChange={(e) =>
                                  handleDishIngredientChange(
                                    index,
                                    "ingredientId",
                                    e.target.value
                                  )
                                }
                                className="mt-1 block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                              >
                                <option value="">Chọn nguyên liệu</option>
                                {ingredientOptions.map((ing) => (
                                  <option
                                    key={ing.id}
                                    value={ing.id}
                                    disabled={dishIngredients.some(
                                      (di, idx) =>
                                        idx !== index &&
                                        di.ingredientId === ing.id
                                    )}
                                  >
                                    {ing.name} ({ing.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveDishIngredient(index)
                                }
                                className="text-red-600 hover:text-red-700"
                                title="Xóa nguyên liệu này khỏi danh sách"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    id="inStock"
                    name="inStock"
                    type="checkbox"
                    checked={formState.inStock}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-indigo-600 bg-white border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label
                    htmlFor="inStock"
                    className="ml-2 block text-sm text-gray-700"
                  >
                    Còn hàng
                  </label>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hình ảnh
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formState.imageUrls.map((url, index) => {
                      const imageUrl =
                        url.startsWith("http://") || url.startsWith("https://")
                          ? url
                          : `${BASE_URL}/${url.replace(/^\//, "")}`;
                      return (
                        <div key={index} className="relative">
                          <img
                            src={imageUrl}
                            alt={`Preview ${index}`}
                            className="w-20 h-20 rounded-md object-cover border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-transform hover:scale-110"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer w-20 h-20 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md hover:border-indigo-500 hover:bg-gray-50 transition"
                    >
                      <div className="text-center">
                        <PlusIcon className="mx-auto h-6 w-6 text-gray-400" />
                        <span className="mt-1 block text-xs font-medium text-gray-500">
                          Tải lên
                        </span>
                      </div>
                    </label>
                    <input
                      id="image-upload"
                      name="image-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </div>
                </div>
              </section>
            </div>

            {/* Phần 2: Hiển thị công thức */}
            <div className="space-y-3 overflow-y-auto pl-4 scrollbar-hide min-h-0">
              <div className="flex justify-between items-center flex-shrink-0 gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Công thức
                  </h3>
                  <span className="text-sm text-gray-500">
                    {recipes.length} công thức
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddRecipe}
                  disabled={
                    ingredientOptions.length === 0 ||
                    loadingVersions ||
                    dishIngredients.length === 0
                  }
                  title={
                    dishIngredients.length === 0
                      ? "Vui lòng thêm nguyên liệu trước khi tạo công thức"
                      : ingredientOptions.length === 0
                      ? "Cần có ít nhất một nguyên liệu để tạo công thức"
                      : loadingVersions
                      ? "Đang tải danh sách phiên bản..."
                      : undefined
                  }
                  className={`flex items-center gap-1 text-sm py-1 px-3 bg-indigo-600 text-white font-semibold rounded-lg transition ${
                    ingredientOptions.length === 0 ||
                    loadingVersions ||
                    dishIngredients.length === 0
                      ? "opacity-60 cursor-not-allowed"
                      : "hover:bg-indigo-500"
                  }`}
                >
                  <PlusIcon className="w-4 h-4" /> Thêm công thức
                </button>
              </div>
              <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 scrollbar-hide">
                {recipes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Chưa có công thức để hiển thị.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recipes.map((recipe) => {
                      const versions = formState.sizes.filter(
                        (size) => size.recipe.id === recipe.id
                      );
                      const isActive = selectedRecipeDetailId === recipe.id;
                      return (
                        <div
                          key={recipe.id}
                          className={`border rounded-lg ${
                            isActive
                              ? "border-indigo-300 bg-indigo-50"
                              : "border-gray-200 bg-gray-50"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleRecipeDetail(recipe.id)}
                            className="w-full flex items-center justify-between px-4 py-3 text-left"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {recipe.name}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {recipe.ingredients.length} nguyên liệu •{" "}
                                {versions.length} phiên bản
                              </p>
                            </div>
                            <span className="text-xs text-indigo-600">
                              {isActive ? "Thu gọn" : "Xem chi tiết"}
                            </span>
                          </button>
                          {isActive && (
                            <div className="border-t border-gray-200 px-4 py-3 space-y-4 bg-white rounded-b-lg">
                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                  Nguyên liệu
                                </h4>
                                {recipe.ingredients.length > 0 ? (
                                  <ul className="space-y-1">
                                    {recipe.ingredients.map(
                                      (ingredient, idx) => (
                                        <li
                                          key={`${recipe.id}-ingredient-${idx}`}
                                          className="text-sm text-gray-700 flex justify-between"
                                        >
                                          <span>
                                            {ingredient.ingredient.name}
                                          </span>
                                          <span className="text-gray-500">
                                            {ingredient.quantity || 0}{" "}
                                            {ingredient.ingredient.unit}
                                          </span>
                                        </li>
                                      )
                                    )}
                                  </ul>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    Chưa có nguyên liệu nào.
                                  </p>
                                )}
                              </div>
                              <div>
                                <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                                  Phiên bản sử dụng công thức này
                                </h4>
                                {versions.length > 0 ? (
                                  <div className="space-y-2">
                                    {versions.map((version, idx) => (
                                      <div
                                        key={`${recipe.id}-version-${idx}`}
                                        className="flex items-center justify-between text-sm text-gray-700"
                                      >
                                        <span>
                                          {version.name || "Chưa đặt tên"}
                                        </span>
                                        <span className="text-gray-500">
                                          {version.price?.toLocaleString(
                                            "vi-VN",
                                            {
                                              style: "currency",
                                              currency: "VND",
                                            }
                                          ) || "-"}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-gray-500">
                                    Chưa có phiên bản nào gán công thức này.
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>
        {isRecipeModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/60 flex">
            <form
              onSubmit={handleSubmitRecipeModal}
              className="bg-white shadow-2xl w-full h-full max-h-full overflow-y-auto p-6 space-y-5 flex flex-col"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Thêm công thức mới
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Mỗi công thức cần ít nhất một nguyên liệu với số lượng cụ
                    thể.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseRecipeModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XIcon className="w-6 h-6" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tên công thức
                </label>
                <input
                  type="text"
                  value={recipeDraftName}
                  onChange={(e) => setRecipeDraftName(e.target.value)}
                  placeholder="VD: Công thức nước lẩu cay"
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phiên bản (bắt buộc)
                </label>
                <select
                  value={recipeDraftVersionId}
                  onChange={(e) => handleDraftVersionChange(e.target.value)}
                  disabled={versionOptions.length === 0}
                  className="mt-1 block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                >
                  <option value="">Chọn phiên bản</option>
                  {versionOptions.map((opt) => {
                    const disabled = recipes.some(
                      (recipe) => recipe.versionId === opt.id
                    );
                    return (
                      <option key={opt.id} value={opt.id} disabled={disabled}>
                        {opt.name}
                        {disabled ? " (đã dùng)" : ""}
                      </option>
                    );
                  })}
                </select>
                {loadingVersions && (
                  <p className="text-xs text-gray-500 mt-1">
                    Đang tải danh sách phiên bản...
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  {/* <span className="text-sm font-medium text-gray-700">
                    Nguyên liệu ({recipeDraftIngredients.length})
                  </span> */}
                  <button
                    type="button"
                    onClick={handleAddDraftIngredient}
                    className="flex items-center gap-1 text-xs py-1 px-2 bg-indigo-600 text-white rounded hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={recipeIngredientOptions.length === 0}
                  >
                    <PlusIcon className="w-3.5 h-3.5" /> Thêm nguyên liệu
                  </button>
                </div>
                {recipeDraftIngredients.length === 0 ? (
                  <p className="text-xs text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded p-4 text-center">
                    Chưa có nguyên liệu nào. Nhấn "Thêm nguyên liệu" để bắt đầu.
                  </p>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {recipeDraftIngredients.map((draft, index) => (
                      <div
                        key={`${draft.ingredientId}-${index}`}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex-1">
                          <label className="block text-[11px] uppercase text-gray-500 tracking-wide">
                            Nguyên liệu
                          </label>
                          <select
                            value={draft.ingredientId}
                            onChange={(e) =>
                              handleDraftIngredientChange(
                                index,
                                "ingredientId",
                                e.target.value
                              )
                            }
                            className="mt-1 w-full bg-white border border-gray-300 rounded-md py-1.5 px-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">Chọn nguyên liệu</option>
                            {recipeIngredientOptions.map((ing) => (
                              <option key={ing.id} value={ing.id}>
                                {ing.name} ({ing.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-32">
                          <label className="block text-[11px] uppercase text-gray-500 tracking-wide">
                            Số lượng
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={draft.quantity}
                            onChange={(e) =>
                              handleDraftIngredientChange(
                                index,
                                "quantity",
                                e.target.value
                              )
                            }
                            className="mt-1 w-full bg-white border border-gray-300 rounded-md py-1.5 px-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDraftIngredient(index)}
                          className="text-red-600 hover:text-red-700 mt-5"
                          title="Xóa nguyên liệu này"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCloseRecipeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-500"
                >
                  Lưu công thức
                </button>
              </div>
            </form>
          </div>
        )}
        <footer className="p-4 flex justify-end gap-3 border-t border-gray-200 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Hủy
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="py-2 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-500 transition"
          >
            Lưu món
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MenuItemModal;
