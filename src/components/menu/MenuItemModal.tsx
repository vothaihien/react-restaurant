import React, { useState, useEffect, useCallback, useMemo } from "react";
import type {
  MenuItem,
  MenuItemSize,
  RecipeIngredient,
  Recipe,
  Category,
} from "@/types/menu";
import type { Ingredient } from "@/types/inventory";
import { useAppContext } from "@/contexts/AppContext";
import { useFeedback } from "@/contexts/FeedbackContext";
import { XIcon, PlusIcon, TrashIcon } from "@/components/icons";
import { BASE_URL } from "@/utils/api";
import { menuApi } from "@/api/menu";
import { formatVND } from "@/utils";

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

type MenuImageDraft = {
  id: string;
  name: string;
  dataUrl: string;
  type: string;
  size: number;
  createdAt: number;
  lastModified?: number;
};

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error(`Không thể đọc file ${file.name}. Vui lòng thử lại.`));
    reader.readAsDataURL(file);
  });
};

const dataUrlToFile = (
  dataUrl: string,
  fileName: string,
  mimeType?: string
): File => {
  const parts = dataUrl.split(",");
  if (parts.length !== 2) {
    throw new Error("Dữ liệu ảnh không hợp lệ.");
  }
  const meta = parts[0];
  const base64Data = parts[1];
  const mimeMatch = meta.match(/data:(.*?);base64/);
  const mime = mimeType || mimeMatch?.[1] || "image/png";
  const binary = atob(base64Data);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  return new File([array], fileName, { type: mime });
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
  const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null);
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
  const [imageDrafts, setImageDrafts] = useState<MenuImageDraft[]>([]);

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
      const uniqueOptions = Array.from(
        new Map(mapped.map((option) => [option.id, option])).values()
      );
      setVersionOptions(uniqueOptions);
      return uniqueOptions;
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

  const displayImages = useMemo(
    () => [
      ...formState.imageUrls.map((url) => {
        const normalized =
          url.startsWith("http://") || url.startsWith("https://")
            ? url
            : `${BASE_URL}/${url.replace(/^\//, "")}`;
        return {
          id: url,
          url: normalized,
          source: "remote" as const,
        };
      }),
      ...imageDrafts.map((draft) => ({
        id: draft.id,
        url: draft.dataUrl,
        source: "draft" as const,
      })),
    ],
    [formState.imageUrls, imageDrafts]
  );

  const calculateRecipeCost = useCallback(
    (recipe: Recipe) => {
      if (!recipe?.ingredients) return 0;
      return recipe.ingredients.reduce((total, item) => {
        const price =
          item.ingredient?.price ??
          ingredientMap.get(item.ingredient?.id || "")?.price ??
          0;
        const quantity = Number(item.quantity) || 0;
        return total + price * quantity;
      }, 0);
    },
    [ingredientMap]
  );

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
    if (!isOpen) {
      setImageDrafts([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (itemToEdit) {
      setImageDrafts([]);
    }
  }, [itemToEdit]);

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
    if (dishIngredients.length === 0) {
      setRecipeDraftIngredients([]);
      return;
    }
    setRecipeDraftIngredients((prev) => {
      if (prev.length === 0) {
        return buildDraftIngredientsFromDish();
      }
      const quantityMap = new Map(
        prev.map((item) => [item.ingredientId, item.quantity])
      );
      return dishIngredients.map((item) => ({
        ingredientId: item.ingredientId,
        quantity:
          quantityMap.get(item.ingredientId) ??
          (item.defaultQuantity === "" ? "" : Number(item.defaultQuantity)),
      }));
    });
  }, [dishIngredients, buildDraftIngredientsFromDish]);

  useEffect(() => {
    if (recipeDraftVersionId) return;
    const available = getFirstAvailableVersion();
    if (available) {
      setRecipeDraftVersionId(available.id);
      setRecipeDraftName((prev) =>
        prev ? prev : `Công thức ${available.name}`
      );
    }
  }, [recipeDraftVersionId, getFirstAvailableVersion]);

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

      if (file.size > 10 * 1024 * 1024) {
        notify({
          tone: "warning",
          title: "File quá lớn",
          description: `${file.name} vượt quá 10MB.`,
        });
        continue;
      }

      // Chế độ chỉnh sửa vẫn upload ngay lên server
      if (itemToEdit) {
        const fileId = `${file.name}_${Date.now()}`;
        setUploadingImages((prev) => [...prev, fileId]);
        try {
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
        continue;
      }

      // Thêm mới: lưu tạm vào localStorage cho đến khi bấm Lưu món
      try {
        const dataUrl = await fileToDataUrl(file);
        const draft: MenuImageDraft = {
          id: `${file.name}_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2)}`,
          name: file.name,
          dataUrl,
          type: file.type,
          size: file.size,
          lastModified: file.lastModified,
          createdAt: Date.now(),
        };
        setImageDrafts((prev) => [...prev, draft]);
        notify({
          tone: "success",
          title: "Đã lưu ảnh tạm",
          description: `${file.name} sẽ được tải lên khi bạn lưu món.`,
        });
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Không thể xử lý ảnh",
          description: error?.message || `Không thể lưu tạm ảnh ${file.name}.`,
        });
      }
    }

    e.target.value = "";
  };
  const handleRemoveImage = (imageId: string, source: "remote" | "draft") => {
    if (source === "remote") {
      setFormState((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((url) => url !== imageId),
      }));
      return;
    }
    setImageDrafts((prev) => prev.filter((draft) => draft.id !== imageId));
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
  const resetRecipeDraft = () => {
    setEditingRecipeId(null);
    const availableVersion = getFirstAvailableVersion();
    setRecipeDraftVersionId(availableVersion?.id || "");
    const generatedName = availableVersion
      ? `Công thức ${availableVersion.name}`
      : generateUniqueRecipeName();
    setRecipeDraftName(generatedName);
    const presetDrafts = buildDraftIngredientsFromDish();
    setRecipeDraftIngredients(presetDrafts);
  };

  const handleEditRecipe = (recipeId: string) => {
    const target = recipes.find((recipe) => recipe.id === recipeId);
    if (!target) {
      notify({
        tone: "error",
        title: "Không tìm thấy công thức",
        description: "Vui lòng tải lại dữ liệu và thử lại.",
      });
      return;
    }
    setEditingRecipeId(recipeId);
    setRecipeDraftName(target.name);
    setRecipeDraftVersionId(target.versionId || "");
    const quantityMap = new Map<string, number>();
    target.ingredients.forEach((item) => {
      if (item.ingredient?.id) {
        quantityMap.set(item.ingredient.id, item.quantity);
      }
    });
    if (dishIngredients.length > 0) {
      setRecipeDraftIngredients(
        dishIngredients.map((item) => ({
          ingredientId: item.ingredientId,
          quantity: normalizeIntegerQuantity(
            quantityMap.get(item.ingredientId) ??
              (item.defaultQuantity === "" ? "" : Number(item.defaultQuantity))
          ),
        }))
      );
    } else {
      const presetDrafts =
        target.ingredients.length > 0
          ? target.ingredients
              .map((item) => ({
                ingredientId: item.ingredient?.id || "",
                quantity: normalizeIntegerQuantity(item.quantity),
              }))
              .filter((draft) => draft.ingredientId)
          : [];
      setRecipeDraftIngredients(presetDrafts);
    }
  };

  const handleDraftVersionChange = (versionId: string) => {
    const duplicated =
      versionId &&
      recipes.some(
        (recipe) =>
          recipe.versionId === versionId && recipe.id !== editingRecipeId
      );
    if (duplicated) {
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

  const normalizeIntegerQuantity = (input: string | number | "") => {
    if (input === "" || input === null || input === undefined) return "";
    const parsed = typeof input === "number" ? input : Number(input);
    if (!Number.isFinite(parsed)) return "";
    return Math.max(0, Math.floor(parsed));
  };

  const handleRecipeIngredientQuantityChange = (
    ingredientId: string,
    value: string
  ) => {
    const normalized = normalizeIntegerQuantity(value);
    setRecipeDraftIngredients((prev) =>
      prev.map((item) =>
        item.ingredientId === ingredientId
          ? {
              ...item,
              quantity: normalized,
            }
          : item
      )
    );
  };

  const handleSubmitRecipeForm = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation(); // Ngăn event bubble lên form cha
    }
    if (!recipeDraftName.trim()) {
      notify({
        tone: "warning",
        title: "Thiếu tên công thức",
        description: "Vui lòng nhập tên cho công thức.",
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
    const duplicateVersion = recipes.some(
      (r) => r.versionId === recipeDraftVersionId && r.id !== editingRecipeId
    );
    if (duplicateVersion) {
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
    if (recipeDraftIngredients.length === 0) {
      notify({
        tone: "warning",
        title: "Chưa có nguyên liệu",
        description:
          "Vui lòng thêm nguyên liệu cho món trước khi tạo công thức.",
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
      const normalizedQuantity = normalizeIntegerQuantity(item.quantity);
      recipeIngredients.push({
        ingredient,
        quantity:
          normalizedQuantity === "" ? 0 : (normalizedQuantity as number),
      });
    }

    const baseRecipe: Recipe = {
      id: editingRecipeId || generateUniqueRecipeId(),
      name: recipeDraftName.trim(),
      ingredients: recipeIngredients,
      versionId: recipeDraftVersionId,
      versionName: selectedVersion.name,
    };

    if (editingRecipeId) {
      setRecipes((prev) =>
        prev.map((r) => (r.id === editingRecipeId ? baseRecipe : r))
      );
      const recipeClone: Recipe = JSON.parse(JSON.stringify(baseRecipe));
      setFormState((prev) => ({
        ...prev,
        sizes: prev.sizes.map((s) =>
          s.recipe.id === editingRecipeId ? { ...s, recipe: recipeClone } : s
        ),
      }));
      setSelectedRecipeForIngredients(baseRecipe.id);
      setSelectedRecipeDetailId(baseRecipe.id);
      notify({
        tone: "success",
        title: "Đã cập nhật công thức",
        description: `Công thức "${baseRecipe.name}" đã được cập nhật.`,
      });
    } else {
      setRecipes((prev) => [...prev, baseRecipe]);
      setSelectedRecipeForIngredients(baseRecipe.id);
      setSelectedRecipeDetailId(baseRecipe.id);
      notify({
        tone: "success",
        title: "Đã thêm công thức",
        description: `Công thức "${baseRecipe.name}" đã được tạo.`,
      });
    }

    resetRecipeDraft();
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
    if (!selected) {
      notify({
        tone: "warning",
        title: "Phiên bản không tồn tại",
        description: "Phiên bản đã chọn không tồn tại. Vui lòng chọn lại.",
      });
      return;
    }
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

  const uploadDraftImages = async (): Promise<string[]> => {
    if (imageDrafts.length === 0) return [];
    const uploadedUrls: string[] = [];
    for (const draft of imageDrafts) {
      try {
        const file = dataUrlToFile(draft.dataUrl, draft.name, draft.type);
        const result = await menuApi.uploadImage(file);
        uploadedUrls.push(result.url);
      } catch (error: any) {
        throw new Error(
          error?.message || `Không thể upload ảnh ${draft.name}.`
        );
      }
    }
    return uploadedUrls;
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

    const totalImagesCount = formState.imageUrls.length + imageDrafts.length;

    if (!name || sizes.length === 0 || totalImagesCount === 0) {
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

    let imageUrlsForPayload = [...formState.imageUrls];

    if (!itemToEdit) {
      try {
        const uploadedUrls = await uploadDraftImages();
        if (uploadedUrls.length > 0) {
          imageUrlsForPayload = [...imageUrlsForPayload, ...uploadedUrls];
          setFormState((prev) => ({ ...prev, imageUrls: imageUrlsForPayload }));
          setImageDrafts([]);
        }
      } catch (error: any) {
        notify({
          tone: "error",
          title: "Upload ảnh thất bại",
          description:
            error?.message ||
            "Không thể tải ảnh lên server. Vui lòng thử lại trước khi lưu món.",
        });
        return;
      }
    }

    if (itemToEdit) {
      await menuApi.updateDish(itemToEdit.id, apiData);

      updateMenuItem({
        id: itemToEdit.id,
        name,
        description,
        category: matchedCategory?.name || category,
        categoryId: matchedCategory?.id ?? categoryId ?? itemToEdit?.categoryId,
        imageUrls: imageUrlsForPayload,
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
            SoLuongCanDung: (() => {
              const normalized = normalizeIntegerQuantity(ing.quantity);
              return normalized === "" ? 0 : (normalized as number);
            })(),
          })),
        }));

        const apiData = {
          TenMonAn: name,
          MaDanhMuc: matchedCategory?.id || categoryId || null,
          IsShow: true,
          HinhAnhUrls: imageUrlsForPayload,
          PhienBanMonAns: phienBanMonAns,
        };

        await menuApi.createDish(apiData);

        // Cũng thêm vào local state để hiển thị ngay
        addMenuItem({
          name,
          description,
          category: matchedCategory?.name || category,
          categoryId: matchedCategory?.id ?? categoryId,
          imageUrls: imageUrlsForPayload,
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
                    {displayImages.map((image) => (
                      <div key={image.id} className="relative">
                        <img
                          src={image.url}
                          alt="Preview"
                          className="w-20 h-20 rounded-md object-cover border border-gray-200"
                        />
                        {image.source === "draft" && (
                          <span className="absolute bottom-1 left-1 text-[10px] font-semibold bg-white/80 text-gray-700 px-1 rounded">
                            Tạm
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveImage(image.id, image.source)
                          }
                          className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg transition-transform hover:scale-110"
                        >
                          <XIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
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
            <div className="space-y-6 overflow-y-auto pl-4 scrollbar-hide min-h-0">
              <div className="flex justify-between items-center flex-shrink-0 gap-3 flex-wrap">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Công thức
                  </h3>
                  <span className="text-sm text-gray-500">
                    {recipes.length} công thức
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-white rounded-lg border border-gray-200 p-4 scrollbar-hide">
                {recipes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Chưa có công thức để hiển thị.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {recipes.map((recipe) => {
                      const recipeCost = calculateRecipeCost(recipe);
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
                          <div className="flex items-center justify-between gap-3 px-4 py-3">
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleRecipeDetail(recipe.id)
                              }
                              className="flex-1 flex items-center justify-between text-left"
                            >
                              <div>
                                <p className="font-medium text-gray-900">
                                  {recipe.name}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {recipe.ingredients.length} nguyên liệu •{" "}
                                  {versions.length} phiên bản
                                </p>
                                <p className="text-xs font-semibold text-emerald-600 mt-1">
                                  Chi phí nguyên liệu: {formatVND(recipeCost)}
                                </p>
                              </div>
                              <span className="text-xs text-indigo-600">
                                {isActive ? "Thu gọn" : "Xem chi tiết"}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditRecipe(recipe.id)}
                              className="text-xs font-semibold text-indigo-700 hover:text-indigo-900 px-2 py-1 border border-indigo-200 rounded transition"
                            >
                              Sửa
                            </button>
                          </div>
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
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              <div className="bg-white rounded-lg border border-indigo-100 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      {editingRecipeId
                        ? "Chỉnh sửa công thức"
                        : "Thêm công thức mới"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Danh sách nguyên liệu được lấy từ phần thông tin món ăn.
                    </p>
                  </div>
                  {editingRecipeId && (
                    <button
                      type="button"
                      onClick={resetRecipeDraft}
                      className="text-sm font-semibold text-gray-600 hover:text-gray-800"
                    >
                      Hủy chỉnh sửa
                    </button>
                  )}
                </div>
                <div className="mt-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Tên công thức
                      </label>
                      <input
                        type="text"
                        value={recipeDraftName}
                        onChange={(e) => setRecipeDraftName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSubmitRecipeForm();
                          }
                        }}
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
                        onChange={(e) =>
                          handleDraftVersionChange(e.target.value)
                        }
                        disabled={versionOptions.length === 0}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md py-2 px-3 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="">Chọn phiên bản</option>
                        {versionOptions.map((opt) => {
                          const disabled = recipes.some(
                            (recipe) =>
                              recipe.versionId === opt.id &&
                              recipe.id !== editingRecipeId
                          );
                          return (
                            <option
                              key={opt.id}
                              value={opt.id}
                              disabled={disabled}
                            >
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
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nguyên liệu (từ thông tin món ăn)
                    </label>
                    {dishIngredients.length === 0 ? (
                      <p className="text-sm text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-lg p-4 text-center">
                        Vui lòng thêm nguyên liệu cho món trước khi tạo công
                        thức.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {recipeDraftIngredients.map((draft) => {
                          const ingredient = ingredientMap.get(
                            draft.ingredientId
                          );
                          return (
                            <div
                              key={draft.ingredientId}
                              className="flex flex-col md:flex-row md:items-center gap-3 border border-gray-200 rounded-lg p-3 bg-gray-50"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {ingredient?.name || "Nguyên liệu"}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Đơn vị: {ingredient?.unit || "N/A"}
                                </p>
                              </div>
                              <div className="w-full md:w-40">
                                <label className="block text-[11px] uppercase text-gray-500 tracking-wide">
                                  Số lượng
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={draft.quantity}
                                  onChange={(e) =>
                                    handleRecipeIngredientQuantityChange(
                                      draft.ingredientId,
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSubmitRecipeForm();
                                    }
                                  }}
                                  className="mt-1 w-full bg-white border border-gray-300 rounded-md py-1.5 px-2 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="0"
                                  disabled={!ingredient}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleSubmitRecipeForm()}
                      className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={dishIngredients.length === 0}
                    >
                      {editingRecipeId
                        ? "Cập nhật công thức"
                        : "Thêm công thức"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
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
